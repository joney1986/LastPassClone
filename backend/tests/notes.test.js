const request = require('supertest');
const app = require('../app');
const db = require('../database');

describe('Secure Notes API', () => {
    let user1Token;
    let user2Token;
    let user1NoteId;

    beforeAll(async () => {
        await new Promise(resolve => {
            db.serialize(() => {
                db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, master_password_salt TEXT, encrypted_vault_key TEXT)`);
                db.run(`CREATE TABLE IF NOT EXISTS secure_notes (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, content TEXT, created_at DATETIME, updated_at DATETIME)`, resolve);
            });
        });
    });

    beforeEach(async () => {
        await new Promise(resolve => db.run('DELETE FROM secure_notes', resolve));
        await new Promise(resolve => db.run('DELETE FROM users', resolve));

        await request(app).post('/api/users/register').send({ username: 'user1', password: 'password123', masterPasswordSalt: 's1', encryptedVaultKey: 'k1' });
        await request(app).post('/api/users/register').send({ username: 'user2', password: 'password123', masterPasswordSalt: 's2', encryptedVaultKey: 'k2' });

        const res1 = await request(app).post('/api/users/login').send({ username: 'user1', password: 'password123' });
        const res2 = await request(app).post('/api/users/login').send({ username: 'user2', password: 'password123' });
        user1Token = res1.body.token;
        user2Token = res2.body.token;

        const noteRes = await request(app)
            .post('/api/notes')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ title: 'My Secret Note', content: 'encrypted_content' });
        user1NoteId = noteRes.body.id;
    });

    afterAll(done => db.close(done));

    it('should fetch all notes for a user', async () => {
        const res = await request(app)
            .get('/api/notes')
            .set('Authorization', `Bearer ${user1Token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].title).toEqual('My Secret Note');
    });

    it('should create a new note', async () => {
         const res = await request(app)
            .post('/api/notes')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ title: 'Another Note', content: 'more_encrypted_content' });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
    });

    it('should fetch a single note by id', async () => {
        const res = await request(app)
            .get(`/api/notes/${user1NoteId}`)
            .set('Authorization', `Bearer ${user1Token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.content).toEqual('encrypted_content');
    });

    it('should not fetch a note belonging to another user', async () => {
        const res = await request(app)
            .get(`/api/notes/${user1NoteId}`)
            .set('Authorization', `Bearer ${user2Token}`);
        expect(res.statusCode).toEqual(404);
    });

    it('should update a note', async () => {
        const res = await request(app)
            .put(`/api/notes/${user1NoteId}`)
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ title: 'Updated Title', content: 'updated_content' });
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Note updated successfully');
    });

    it('should delete a note', async () => {
        const res = await request(app)
            .delete(`/api/notes/${user1NoteId}`)
            .set('Authorization', `Bearer ${user1Token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Note deleted successfully');
    });
});
