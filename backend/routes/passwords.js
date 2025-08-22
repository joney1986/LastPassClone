const express = require('express');
const router = express.Router();
const CryptoJS = require('crypto-js');
const { body, validationResult } = require('express-validator');
const db = require('../database.js');
const auth = require('../middleware/auth');

// In a real application, this secret should be stored in an environment variable
const encryptionSecret = 'another_super_secret_key';

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
    const encryptedPassword = encrypt(password);
  const sql = 'UPDATE passwords SET site = ?, username = ?, password = ?, category = ? WHERE id = ? AND user_id = ?';
  const params = [site, username, encryptedPassword, category, req.params.id, req.user.id];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
        return res.status(404).json({ error: 'Password not found or user not authorized' });
    }
    res.json({ message: 'Password updated successfully' });
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
