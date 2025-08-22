const express = require('express');
const router = express.Router();
const CryptoJS = require('crypto-js');
const { body, validationResult } = require('express-validator');
const db = require('../database.js');
const auth = require('../middleware/auth');

const encryptionSecret = process.env.ENCRYPTION_SECRET;

// Protect all routes in this file
router.use(auth);

// Helper functions for encryption and decryption
const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, encryptionSecret).toString();
};

const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionSecret);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// GET all passwords for the logged-in user
router.get('/', (req, res) => {
  const sql = "SELECT * FROM passwords WHERE user_id = ?";
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const decryptedRows = rows.map(row => ({
      ...row,
      password: decrypt(row.password)
    }));
    res.json({ data: decryptedRows });
  });
});

// POST a new password
router.post('/',
  body('site').notEmpty().trim().escape(),
  body('username').notEmpty().trim().escape(),
  body('password').notEmpty(),
  body('category').optional().trim().escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { site, username, password, category } = req.body;
    const encryptedPassword = encrypt(password);
  const sql = 'INSERT INTO passwords (user_id, site, username, password, category) VALUES (?,?,?,?,?)';
  const params = [req.user.id, site, username, encryptedPassword, category];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// GET a single password by id
router.get('/:id', (req, res) => {
    const sql = "SELECT * FROM passwords WHERE id = ? AND user_id = ?";
    db.get(sql, [req.params.id, req.user.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Password not found' });
      }
      res.json({ data: { ...row, password: decrypt(row.password) } });
    });
  });

// GET password history by id
router.get('/:id/history', (req, res) => {
    const passwordId = req.params.id;
    const userId = req.user.id;

    const sql = `
      SELECT h.* FROM password_history h
      JOIN passwords p ON h.password_id = p.id
      WHERE h.password_id = ? AND p.user_id = ?
      ORDER BY h.created_at DESC
    `;

    db.all(sql, [passwordId, userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const decryptedRows = rows.map(row => ({
            ...row,
            password: decrypt(row.password)
        }));
        res.json({ data: decryptedRows });
    });
});

// PUT (update) a password by id
router.put('/:id',
  body('site').notEmpty().trim().escape(),
  body('username').notEmpty().trim().escape(),
  body('password').notEmpty(),
  body('category').optional().trim().escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { site, username, password, category } = req.body;
    const passwordId = req.params.id;
    const userId = req.user.id;

    db.serialize(() => {
      // Begin transaction
      db.run("BEGIN TRANSACTION");

      // 1. Get the current password
      const selectSql = "SELECT * FROM passwords WHERE id = ? AND user_id = ?";
      db.get(selectSql, [passwordId, userId], (err, row) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Database error while fetching password." });
        }
        if (!row) {
          db.run("ROLLBACK");
          return res.status(404).json({ error: "Password not found or user not authorized." });
        }

        // 2. Insert current version into history
        const insertHistorySql = `
          INSERT INTO password_history (password_id, site, username, password, category)
          VALUES (?, ?, ?, ?, ?)`;
        const historyParams = [row.id, row.site, row.username, row.password, row.category];

        db.run(insertHistorySql, historyParams, (err) => {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: "Failed to save password history." });
          }

          // 3. Update the password with new details
          const encryptedPassword = encrypt(password);
          const updateSql = `
            UPDATE passwords
            SET site = ?, username = ?, password = ?, category = ?
            WHERE id = ? AND user_id = ?`;
          const updateParams = [site, username, encryptedPassword, category, passwordId, userId];

          db.run(updateSql, updateParams, function(err) {
            if (err) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: "Failed to update password." });
            }

            // Commit transaction
            db.run("COMMIT");
            res.json({ message: 'Password updated successfully' });
          });
        });
      });
    });
  });

// DELETE a password by id
router.delete('/:id', (req, res) => {
  const sql = 'DELETE FROM passwords WHERE id = ? AND user_id = ?';
  db.run(sql, [req.params.id, req.user.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
        return res.status(404).json({ error: 'Password not found or user not authorized' });
    }
    res.json({ message: 'Password deleted successfully' });
  });
});

module.exports = router;
