const sqlite3 = require('sqlite3').verbose();

const TABLE_SCHEMAS = [
    `CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        master_password_salt TEXT,
        encrypted_vault_key TEXT,
        two_fa_secret TEXT,
        two_fa_enabled INTEGER DEFAULT 0,
        CONSTRAINT username_unique UNIQUE (username)
    )`,
    `CREATE TABLE passwords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        site TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE password_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        password_id INTEGER NOT NULL,
        site TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (password_id) REFERENCES passwords(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE secure_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TRIGGER update_notes_updated_at
        AFTER UPDATE ON secure_notes
        FOR EACH ROW
        BEGIN
            UPDATE secure_notes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END`
];

// Creates a new in-memory database and initializes the schema
const setupDatabase = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(':memory:', (err) => {
            if (err) return reject(err);
        });

        db.serialize(() => {
            TABLE_SCHEMAS.forEach((schema, index) => {
                const isLast = index === TABLE_SCHEMAS.length - 1;
                db.run(schema, (err) => {
                    if (err) return reject(err);
                    if (isLast) {
                        resolve(db);
                    }
                });
            });
        });
    });
};

// Clears all data from the tables
const clearDatabase = (db) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            const tables = ['password_history', 'passwords', 'secure_notes', 'users'];
            tables.forEach((table, index) => {
                const isLast = index === tables.length - 1;
                db.run(`DELETE FROM ${table}`, (err) => {
                    if (err) return reject(err);
                    if (isLast) {
                        resolve();
                    }
                });
            });
        });
    });
};

module.exports = { setupDatabase, clearDatabase };
