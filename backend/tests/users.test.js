const request = require('supertest');
const { setupDatabase, clearDatabase } = require('./test-db');
const speakeasy = require('speakeasy');
const db = require('../database'); // This is now the mock from __mocks__
const app = require('../app');

// This tells Jest to use the manual mock in __mocks__/database.js
jest.mock('../database');

describe('User Authentication API', () => {
    let testDb; // This will be the real database instance
    let authToken;

    beforeAll(async () => {
        // Set up the real test database
        testDb = await setupDatabase();

        // Re-wire the mock to use the real test database
        db.get.mockImplementation(testDb.get.bind(testDb));
        db.all.mockImplementation(testDb.all.bind(testDb));
        db.run.mockImplementation(testDb.run.bind(testDb));
        db.serialize.mockImplementation(testDb.serialize.bind(testDb));
        db.close.mockImplementation(testDb.close.bind(testDb));
    });

    beforeEach(async () => {
        // Clear the real database before each test
        await clearDatabase(testDb);

        // Register and login a user to get a token for authenticated requests
        await request(app).post('/api/users/register').send({
            username: 'testuser', password: 'password123', encryptedVaultKey: 'key', masterPasswordSalt: 'salt'
        });
        const loginRes = await request(app).post('/api/users/login').send({ username: 'testuser', password: 'password123' });
        authToken = loginRes.body.token;
    });

    afterAll((done) => {
        // Close the real database connection
        testDb.close((err) => {
            if (err) console.error(err.message);
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
