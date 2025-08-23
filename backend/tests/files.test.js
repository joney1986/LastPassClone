const request = require('supertest');
const { setupDatabase, clearDatabase } = require('./test-db');
const db = require('../database');
const app = require('../app');
const fs = require('fs');
const path = require('path');

jest.mock('../database');

describe('Secure Files API', () => {
    let testDb;

    beforeAll(async () => {
        testDb = await setupDatabase();
        db.get.mockImplementation(testDb.get.bind(testDb));
        db.all.mockImplementation(testDb.all.bind(testDb));
        db.run.mockImplementation(testDb.run.bind(testDb));
        db.serialize.mockImplementation(testDb.serialize.bind(testDb));
        db.close.mockImplementation(testDb.close.bind(testDb));

        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
    });

    afterAll((done) => {
        testDb.close((err) => {
            if (err) console.error(err.message);
            // Cleanup the uploads directory
            const uploadsDir = path.join(__dirname, '..', 'uploads');
            if (fs.existsSync(uploadsDir)) {
                fs.rmSync(uploadsDir, { recursive: true, force: true });
            }
            done();
        });
    });

    const setupTestUserAndFile = async () => {
        await clearDatabase(testDb);
        await request(app).post('/api/users/register').send({ username: 'fileuser', password: 'password123', masterPasswordSalt: 's1', encryptedVaultKey: 'k1' });
        const loginRes = await request(app).post('/api/users/login').send({ username: 'fileuser', password: 'password123' });
        const token = loginRes.body.token;
        const fileRes = await request(app)
            .post('/api/files/upload')
            .set('Authorization', `Bearer ${token}`)
            .send({
                fileNameEncrypted: 'encrypted_filename.txt',
                fileType: 'text/plain',
                fileContentEncrypted: 'super_secret_encrypted_content'
            });
        const fileId = fileRes.body.id;
        return { token, fileId };
    };

    it('should upload a new file', async () => {
        await clearDatabase(testDb);
        await request(app).post('/api/users/register').send({ username: 'testuser', password: 'password123', masterPasswordSalt: 's1', encryptedVaultKey: 'k1' });
        const loginRes = await request(app).post('/api/users/login').send({ username: 'testuser', password: 'password123' });
        const token = loginRes.body.token;

        const res = await request(app)
            .post('/api/files/upload')
            .set('Authorization', `Bearer ${token}`)
            .send({
                fileNameEncrypted: 'test_file.txt',
                fileType: 'text/plain',
                fileContentEncrypted: 'VGhpcyBpcyBhIHRlc3QgZmlsZQ==' // "This is a test file" in base64
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');

        // Verify the file was created in the database
        const dbRes = await new Promise((resolve, reject) => {
            testDb.get("SELECT * FROM secure_files WHERE id = ?", [res.body.id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
        expect(dbRes).not.toBeNull();
        expect(dbRes.file_name_encrypted).toBe('test_file.txt');
        expect(fs.existsSync(dbRes.storage_path)).toBe(true);
        const fileContent = fs.readFileSync(dbRes.storage_path, 'utf8');
        expect(fileContent).toBe('VGhpcyBpcyBhIHRlc3QgZmlsZQ==');
    });

    it('should fetch all files for a user', async () => {
        const { token } = await setupTestUserAndFile();
        const res = await request(app)
            .get('/api/files')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].file_name_encrypted).toEqual('encrypted_filename.txt');
    });

    it('should fetch a single file by id', async () => {
        const { token, fileId } = await setupTestUserAndFile();
        const res = await request(app)
            .get(`/api/files/${fileId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('super_secret_encrypted_content');
    });

    it('should delete a file', async () => {
        const { token, fileId } = await setupTestUserAndFile();

        // Get the storage path before deleting
        const dbFile = await new Promise((resolve, reject) => {
            testDb.get("SELECT storage_path FROM secure_files WHERE id = ?", [fileId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
        const filePath = dbFile.storage_path;
        expect(fs.existsSync(filePath)).toBe(true);


        const res = await request(app)
            .delete(`/api/files/${fileId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('File deleted successfully');

        // Verify the file is gone from DB and filesystem
         const dbRes = await new Promise((resolve, reject) => {
            testDb.get("SELECT * FROM secure_files WHERE id = ?", [fileId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
        expect(dbRes).toBeUndefined();
        expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should not fetch a file belonging to another user', async () => {
        const { fileId } = await setupTestUserAndFile();

        await request(app).post('/api/users/register').send({ username: 'user2', password: 'password123', masterPasswordSalt: 's2', encryptedVaultKey: 'k2' });
        const loginRes2 = await request(app).post('/api/users/login').send({ username: 'user2', password: 'password123' });
        const token2 = loginRes2.body.token;

        const res = await request(app)
            .get(`/api/files/${fileId}`)
            .set('Authorization', `Bearer ${token2}`);
        expect(res.statusCode).toEqual(404);
    });
});
