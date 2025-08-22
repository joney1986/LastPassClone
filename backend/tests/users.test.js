const request = require('supertest');
const app = require('../app');
const db = require('../database');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');

// Helper function to run migrations for a clean state
const runMigrations = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE,
                    password TEXT,
                    master_password_salt TEXT,
                    encrypted_vault_key TEXT,
                    two_fa_secret TEXT,
                    two_fa_enabled INTEGER DEFAULT 0
                )
            `, (err) => { if (err) return reject(err); });
            db.run(`CREATE TABLE passwords (id INTEGER PRIMARY KEY, user_id INTEGER)`, (err) => { if (err) return reject(err); });
            db.run(`CREATE TABLE notes (id INTEGER PRIMARY KEY, user_id INTEGER)`, (err) => { if (err) return reject(err); resolve(); });
        });
    });
};

// Helper function to clear tables
const clearDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('DELETE FROM notes', (err) => { if (err) return reject(err); });
            db.run('DELETE FROM passwords', (err) => { if (err) return reject(err); });
            db.run('DELETE FROM users', (err) => { if (err) return reject(err); resolve(); });
        });
    });
};


describe('User Authentication API', () => {
    let authToken;

    beforeAll(async () => {
        await runMigrations();
    });

    beforeEach(async () => {
        await clearDatabase();
        // Register and login a user to get a token for authenticated requests
        await request(app).post('/api/users/register').send({
            username: 'testuser', password: 'password123', encryptedVaultKey: 'key', masterPasswordSalt: 'salt'
        });
        const loginRes = await request(app).post('/api/users/login').send({ username: 'testuser', password: 'password123' });
        authToken = loginRes.body.token;
    });

    afterAll((done) => {
        db.close((err) => {
            if (err) return console.error(err.message);
            done();
        });
    });

    describe('POST /api/users/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/users/register')
                .send({ username: 'newuser', password: 'password123', encryptedVaultKey: 'key', masterPasswordSalt: 'salt' });
            expect(res.statusCode).toEqual(200);
        });
    });

    describe('POST /api/users/login', () => {
        it('should login a user successfully', async () => {
            const res = await request(app)
                .post('/api/users/login')
                .send({ username: 'testuser', password: 'password123' });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
        });
    });

    describe('2FA Flow', () => {
        let twoFaSecret;

        it('should get a 2FA setup secret and QR code', async () => {
            const res = await request(app)
                .post('/api/users/2fa/setup')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('qrCodeUrl');
            expect(res.body).toHaveProperty('secret');
            twoFaSecret = res.body.secret;
        });

        it('should verify the 2FA token and enable 2FA', async () => {
            // First, get the secret
            const setupRes = await request(app).post('/api/users/2fa/setup').set('Authorization', `Bearer ${authToken}`);
            twoFaSecret = setupRes.body.secret;

            // Generate a valid token
            const token = speakeasy.totp({
                secret: twoFaSecret,
                encoding: 'base32'
            });

            // Verify it
            const verifyRes = await request(app)
                .post('/api/users/2fa/verify')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ token });

            expect(verifyRes.statusCode).toEqual(200);
            expect(verifyRes.body).toHaveProperty('message', '2FA enabled successfully.');
        });

        it('should successfully complete a two-step login', async () => {
            // Setup and enable 2FA first
            const setupRes = await request(app).post('/api/users/2fa/setup').set('Authorization', `Bearer ${authToken}`);
            const secret = setupRes.body.secret;
            const validToken = speakeasy.totp({ secret, encoding: 'base32' });
            await request(app).post('/api/users/2fa/verify').set('Authorization', `Bearer ${authToken}`).send({ token: validToken });

            // Step 1: Login with password
            const loginRes = await request(app).post('/api/users/login').send({ username: 'testuser', password: 'password123' });
            expect(loginRes.statusCode).toEqual(200);
            expect(loginRes.body.twoFactorRequired).toBe(true);
            const tempToken = loginRes.body.tempToken;

            // Step 2: Login with 2FA token
            const finalToken = speakeasy.totp({ secret, encoding: 'base32' });
            const twoFaRes = await request(app)
                .post('/api/users/2fa/login')
                .set('Authorization', `Bearer ${tempToken}`)
                .send({ token: finalToken });

            expect(twoFaRes.statusCode).toEqual(200);
            expect(twoFaRes.body).toHaveProperty('token');
        });

        it('should disable 2FA', async () => {
            const res = await request(app)
                .post('/api/users/2fa/disable')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message', '2FA disabled successfully.');
        });
    });
});
