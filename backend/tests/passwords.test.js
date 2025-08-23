const request = require('supertest');
const { setupDatabase, clearDatabase } = require('./test-db');
const db = require('../database'); // This is now the mock from __mocks__
const app = require('../app');

// This tells Jest to use the manual mock in __mocks__/database.js
jest.mock('../database');

describe('Passwords API', () => {
    let testDb; // This will be the real database instance

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

    afterAll((done) => {
        // Close the real database connection
        testDb.close((err) => {
            if (err) console.error(err.message);
            done();
        });
    });

    // Helper function for test setup
    const setupTestUserAndPassword = async () => {
        await clearDatabase(testDb);
        await request(app).post('/api/users/register').send({ username: 'user1', password: 'password123', masterPasswordSalt: 's1', encryptedVaultKey: 'k1' });
        const loginRes = await request(app).post('/api/users/login').send({ username: 'user1', password: 'password123' });
        const token = loginRes.body.token;
        const passRes = await request(app)
            .post('/api/passwords')
            .set('Authorization', `Bearer ${token}`)
            .send({ site: 'test.com', username: 'user1', password: 'encrypted_password' });
        const passwordId = passRes.body.id;
        return { token, passwordId };
    };

    it('should create a new password', async () => {
        await clearDatabase(testDb);
        await request(app).post('/api/users/register').send({ username: 'user1', password: 'password123', masterPasswordSalt: 's1', encryptedVaultKey: 'k1' });
        const loginRes = await request(app).post('/api/users/login').send({ username: 'user1', password: 'password123' });
        const token = loginRes.body.token;

        const res = await request(app)
            .post('/api/passwords')
            .set('Authorization', `Bearer ${token}`)
            .send({ site: 'new.com', username: 'new_user', password: 'new_encrypted_password' });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
    });

    it('should fetch all passwords for a user', async () => {
        const { token } = await setupTestUserAndPassword();
        const res = await request(app)
            .get('/api/passwords')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].site).toEqual('test.com');
    });

    it('should not fetch passwords for another user', async () => {
        await setupTestUserAndPassword();
        // Create and login second user
        await request(app).post('/api/users/register').send({ username: 'user2', password: 'password123', masterPasswordSalt: 's2', encryptedVaultKey: 'k2' });
        const res2 = await request(app).post('/api/users/login').send({ username: 'user2', password: 'password123' });
        const token2 = res2.body.token;

        const res = await request(app)
            .get('/api/passwords')
            .set('Authorization', `Bearer ${token2}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveLength(0);
    });

    it('should update a password', async () => {
        const { token, passwordId } = await setupTestUserAndPassword();
        const res = await request(app)
            .put(`/api/passwords/${passwordId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ site: 'updated.com', username: 'updated_user', password: 'updated_password', category: 'work' });
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Password updated successfully');
    });

    it('should delete a password', async () => {
        const { token, passwordId } = await setupTestUserAndPassword();
        const res = await request(app)
            .delete(`/api/passwords/${passwordId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Password deleted successfully');
    });

    it('should not update a password belonging to another user', async () => {
        const { passwordId } = await setupTestUserAndPassword();
        // Create and login second user
        await request(app).post('/api/users/register').send({ username: 'user2', password: 'password123', masterPasswordSalt: 's2', encryptedVaultKey: 'k2' });
        const res2 = await request(app).post('/api/users/login').send({ username: 'user2', password: 'password123' });
        const token2 = res2.body.token;

        const res = await request(app)
            .put(`/api/passwords/${passwordId}`)
            .set('Authorization', `Bearer ${token2}`)
            .send({ site: 'hacked.com', username: 'hacker', password: 'hacked_password' });
        expect(res.statusCode).toEqual(404);
    });
});
