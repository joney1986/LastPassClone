const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database.js');
const auth = require('../middleware/auth');

// Protect all routes in this file
router.use(auth);

// GET all passwords for the logged-in user
router.get('/', (req, res) => {
  const sql = "SELECT * FROM passwords WHERE user_id = ?";
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Send the encrypted data directly to the client
    res.json({ data: rows });
  });
});

// POST a new password
router.post('/',
  body('site').notEmpty().trim().escape(),
  body('username').notEmpty().trim().escape(),
  body('password').notEmpty(), // This is now the encrypted ciphertext
  body('category').optional().trim().escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { site, username, password, category } = req.body;
    const sql = 'INSERT INTO passwords (user_id, site, username, password, category) VALUES (?,?,?,?,?)';
    const params = [req.user.id, site, username, password, category];

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
      // Send the encrypted data directly
      res.json({ data: row });
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
        // Send the encrypted data directly
        res.json({ data: rows });
    });
});

// PUT (update) a password by id
router.put('/:id',
  body('site').notEmpty().trim().escape(),
  body('username').notEmpty().trim().escape(),
  body('password').notEmpty(), // This is now the encrypted ciphertext
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
      db.run("BEGIN TRANSACTION");
      const selectSql = "SELECT * FROM passwords WHERE id = ? AND user_id = ?";
      db.get(selectSql, [passwordId, userId], (err, row) => {
        if (err || !row) {
          db.run("ROLLBACK");
          return res.status(404).json({ error: "Password not found or user not authorized." });
        }

        const insertHistorySql = `INSERT INTO password_history (password_id, site, username, password, category) VALUES (?, ?, ?, ?, ?)`;
        const historyParams = [row.id, row.site, row.username, row.password, row.category];

        db.run(insertHistorySql, historyParams, (err) => {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: "Failed to save password history." });
          }

          const updateSql = `UPDATE passwords SET site = ?, username = ?, password = ?, category = ? WHERE id = ? AND user_id = ?`;
          const updateParams = [site, username, password, category, passwordId, userId];

          db.run(updateSql, updateParams, function(err) {
            if (err) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: "Failed to update password." });
            }
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
