const request = require('supertest');
const app = require('../app');
const db = require('../database');

describe('Passwords API', () => {
    let user1Token;
    let user2Token;
    let user1PasswordId;

    beforeAll(async () => {
        // Using a promise to ensure tables are created before tests run
        await new Promise(resolve => {
            db.serialize(() => {
                db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, master_password_salt TEXT, encrypted_vault_key TEXT)`);
                db.run(`CREATE TABLE IF NOT EXISTS passwords (id INTEGER PRIMARY KEY, user_id INTEGER, site TEXT, username TEXT, password TEXT, category TEXT)`, resolve);
            });
        });
    });

    beforeEach(async () => {
        // Clear tables
        await new Promise(resolve => db.run('DELETE FROM passwords', resolve));
        await new Promise(resolve => db.run('DELETE FROM users', resolve));

        // Create two users
        await request(app).post('/api/users/register').send({ username: 'user1', password: 'password123', masterPasswordSalt: 's1', encryptedVaultKey: 'k1' });
        await request(app).post('/api/users/register').send({ username: 'user2', password: 'password123', masterPasswordSalt: 's2', encryptedVaultKey: 'k2' });

        // Login both users
        const res1 = await request(app).post('/api/users/login').send({ username: 'user1', password: 'password123' });
        const res2 = await request(app).post('/api/users/login').send({ username: 'user2', password: 'password123' });
        user1Token = res1.body.token;
        user2Token = res2.body.token;

        // Create a password for user1
        const passRes = await request(app)
            .post('/api/passwords')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ site: 'test.com', username: 'user1', password: 'encrypted_password' });
        user1PasswordId = passRes.body.id;
    });

    afterAll(done => db.close(done));

    it('should fetch all passwords for a user', async () => {
        const res = await request(app)
            .get('/api/passwords')
            .set('Authorization', `Bearer ${user1Token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].site).toEqual('test.com');
    });

    it('should not fetch passwords for another user', async () => {
        const res = await request(app)
            .get('/api/passwords')
            .set('Authorization', `Bearer ${user2Token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveLength(0);
    });

    it('should create a new password', async () => {
         const res = await request(app)
            .post('/api/passwords')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ site: 'new.com', username: 'new_user', password: 'new_encrypted_password' });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
    });

    it('should update a password', async () => {
        const res = await request(app)
            .put(`/api/passwords/${user1PasswordId}`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ site: 'updated.com', username: 'updated_user', password: 'updated_password', category: 'work' });
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Password updated successfully');
    });

    it('should not update a password belonging to another user', async () => {
        const res = await request(app)
            .put(`/api/passwords/${user1PasswordId}`)
            .set('Authorization', `Bearer ${user2Token}`)
            .send({ site: 'hacked.com', username: 'hacker', password: 'hacked_password' });
        expect(res.statusCode).toEqual(404);
    });

    it('should delete a password', async () => {
        const res = await request(app)
            .delete(`/api/passwords/${user1PasswordId}`)
            .set('Authorization', `Bearer ${user1Token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Password deleted successfully');
    });
});
