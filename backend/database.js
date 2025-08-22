const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = process.env.NODE_ENV === 'test' ? ':memory:' : 'db.sqlite';

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');

        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            master_password_salt TEXT,
            encrypted_vault_key TEXT,
            two_fa_secret TEXT,
            two_fa_enabled INTEGER DEFAULT 0,
            CONSTRAINT username_unique UNIQUE (username)
        )`,
        (err) => {
            if (err) {
                // Table already exists
            } else {
                // Table just created
                console.log('Users table created.');
            }
        });

        // Passwords table
        db.run(`CREATE TABLE IF NOT EXISTS passwords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            site TEXT NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            category TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        (err) => {
            if (err) {
                // Table already exists
            } else {
                console.log('Passwords table created.');
            }
        });

        // Password History table
        db.run(`CREATE TABLE IF NOT EXISTS password_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            password_id INTEGER NOT NULL,
            site TEXT NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            category TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (password_id) REFERENCES passwords(id) ON DELETE CASCADE
        )`,
        (err) => {
            if (err) { /* Table already exists */ } else { console.log('Password history table created.'); }
        });

        // Secure Notes table
        db.run(`CREATE TABLE IF NOT EXISTS secure_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        (err) => {
            if (err) { /* Table already exists */ } else { console.log('Secure notes table created.'); }
        });

        db.run(`
            CREATE TRIGGER IF NOT EXISTS update_notes_updated_at
            AFTER UPDATE ON secure_notes
            FOR EACH ROW
            BEGIN
                UPDATE secure_notes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
            END;
        `);
    }
});

module.exports = db;
