const request = require('supertest');
const { setupDatabase, clearDatabase } = require('./test-db');
const db = require('../database'); // This is now the mock from __mocks__
const app = require('../app');

// This tells Jest to use the manual mock in __mocks__/database.js
jest.mock('../database');

describe('Secure Notes API', () => {
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
    const setupTestUserAndNote = async () => {
        await clearDatabase(testDb);
        await request(app).post('/api/users/register').send({ username: 'user1', password: 'password123', masterPasswordSalt: 's1', encryptedVaultKey: 'k1' });
        const loginRes = await request(app).post('/api/users/login').send({ username: 'user1', password: 'password123' });
        const token = loginRes.body.token;
        const noteRes = await request(app)
            .post('/api/notes')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'My Secret Note', content: 'encrypted_content' });
        const noteId = noteRes.body.id;
        return { token, noteId };
    };

    it('should create a new note', async () => {
         await clearDatabase(testDb);
         await request(app).post('/api/users/register').send({ username: 'user1', password: 'password123', masterPasswordSalt: 's1', encryptedVaultKey: 'k1' });
         const loginRes = await request(app).post('/api/users/login').send({ username: 'user1', password: 'password123' });
         const token = loginRes.body.token;

         const res = await request(app)
            .post('/api/notes')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Another Note', content: 'more_encrypted_content' });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
    });

    it('should fetch all notes for a user', async () => {
        const { token } = await setupTestUserAndNote();
        const res = await request(app)
            .get('/api/notes')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].title).toEqual('My Secret Note');
    });

    it('should fetch a single note by id', async () => {
        const { token, noteId } = await setupTestUserAndNote();
        const res = await request(app)
            .get(`/api/notes/${noteId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.content).toEqual('encrypted_content');
    });

    it('should update a note', async () => {
        const { token, noteId } = await setupTestUserAndNote();
        const res = await request(app)
            .put(`/api/notes/${noteId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Updated Title', content: 'updated_content' });
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Note updated successfully');
    });

    it('should delete a note', async () => {
        const { token, noteId } = await setupTestUserAndNote();
        const res = await request(app)
            .delete(`/api/notes/${noteId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Note deleted successfully');
    });

    it('should not fetch a note belonging to another user', async () => {
        const { noteId } = await setupTestUserAndNote();
        // create a second user and get their token
        await request(app).post('/api/users/register').send({ username: 'user2', password: 'password123', masterPasswordSalt: 's2', encryptedVaultKey: 'k2' });
        const loginRes2 = await request(app).post('/api/users/login').send({ username: 'user2', password: 'password123' });
        const token2 = loginRes2.body.token;

        const res = await request(app)
            .get(`/api/notes/${noteId}`)
            .set('Authorization', `Bearer ${token2}`);
        expect(res.statusCode).toEqual(404);
    });
});
