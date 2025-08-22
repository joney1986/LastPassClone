const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database.js');
const auth = require('../middleware/auth');

// Protect all routes in this file
router.use(auth);

// GET all notes for the logged-in user
router.get('/', (req, res) => {
  const sql = "SELECT id, title, created_at, updated_at FROM secure_notes WHERE user_id = ? ORDER BY updated_at DESC";
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ data: rows });
  });
});

// POST a new note
router.post('/',
  body('title').notEmpty().trim().escape(),
  body('content').notEmpty(), // This is now the encrypted ciphertext
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content } = req.body;
    const sql = 'INSERT INTO secure_notes (user_id, title, content) VALUES (?,?,?)';
    const params = [req.user.id, title, content];

    db.run(sql, params, function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    });
  });

// GET a single note by id
router.get('/:id', (req, res) => {
    const sql = "SELECT * FROM secure_notes WHERE id = ? AND user_id = ?";
    db.get(sql, [req.params.id, req.user.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Note not found or user not authorized' });
      }
      // Send the encrypted data directly
      res.json({ data: row });
    });
});

// PUT (update) a note by id
router.put('/:id',
  body('title').notEmpty().trim().escape(),
  body('content').notEmpty(), // This is now the encrypted ciphertext
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content } = req.body;
    const sql = 'UPDATE secure_notes SET title = ?, content = ? WHERE id = ? AND user_id = ?';
    const params = [title, content, req.params.id, req.user.id];

    db.run(sql, params, function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
          return res.status(404).json({ error: 'Note not found or user not authorized' });
      }
      res.json({ message: 'Note updated successfully' });
    });
  });

// DELETE a note by id
router.delete('/:id', (req, res) => {
  const sql = 'DELETE FROM secure_notes WHERE id = ? AND user_id = ?';
  db.run(sql, [req.params.id, req.user.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
        return res.status(404).json({ error: 'Note not found or user not authorized' });
    }
    res.json({ message: 'Note deleted successfully' });
  });
});

module.exports = router;
