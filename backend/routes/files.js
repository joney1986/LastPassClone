const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../database.js');
const auth = require('../middleware/auth');

// Protect all routes in this file
router.use(auth);

// POST: Upload a new file
router.post('/upload', (req, res) => {
    const { fileNameEncrypted, fileType, fileContentEncrypted } = req.body;

    if (!fileNameEncrypted || !fileType || !fileContentEncrypted) {
        return res.status(400).json({ error: 'Missing required file metadata or content.' });
    }

    const userDir = path.join('uploads', String(req.user.id));
    fs.mkdirSync(userDir, { recursive: true });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const storagePath = path.join(userDir, `${uniqueSuffix}.txt`);

    fs.writeFile(storagePath, fileContentEncrypted, 'utf8', (err) => {
        if (err) {
            console.error("Failed to save encrypted file:", err);
            return res.status(500).json({ error: "Failed to save file on server." });
        }

        const sql = 'INSERT INTO secure_files (user_id, file_name_encrypted, file_type, storage_path) VALUES (?,?,?,?)';
        const params = [req.user.id, fileNameEncrypted, fileType, storagePath];

        db.run(sql, params, function (err) {
          if (err) {
            // If DB fails, try to clean up the saved file
            fs.unlink(storagePath, (unlinkErr) => {
                if (unlinkErr) console.error("Failed to cleanup file after DB error:", unlinkErr);
            });
            return res.status(500).json({ error: "Failed to save file metadata." });
          }
          res.status(201).json({ id: this.lastID, message: "File uploaded successfully" });
        });
    });
});

// GET: List all files for the logged-in user (metadata only)
router.get('/', (req, res) => {
  const sql = "SELECT id, file_name_encrypted, file_type, created_at, updated_at FROM secure_files WHERE user_id = ? ORDER BY updated_at DESC";
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ data: rows });
  });
});

// GET: Download a single file by its ID
router.get('/:id', (req, res) => {
    const sql = "SELECT * FROM secure_files WHERE id = ? AND user_id = ?";
    db.get(sql, [req.params.id, req.user.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'File not found or user not authorized' });
      }
      // Use path.resolve to get the absolute path and send the file
      res.sendFile(path.resolve(row.storage_path));
    });
});

// DELETE: Delete a file by its ID
router.delete('/:id', (req, res) => {
    // First, find the file to get its storage path
    const getFileSql = "SELECT storage_path FROM secure_files WHERE id = ? AND user_id = ?";
    db.get(getFileSql, [req.params.id, req.user.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'File not found or user not authorized' });
        }

        const filePath = row.storage_path;

        // Second, delete the record from the database
        const deleteSql = 'DELETE FROM secure_files WHERE id = ? AND user_id = ?';
        db.run(deleteSql, [req.params.id, req.user.id], function (err) {
            if (err) {
                return res.status(500).json({ error: "Failed to delete file metadata." });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'File not found during deletion attempt.' });
            }

            // Finally, delete the actual file from the filesystem
            fs.unlink(path.resolve(filePath), (unlinkErr) => {
                if (unlinkErr) {
                    // Log the error, but the primary goal (deleting the DB record) was successful.
                    console.error(`Failed to delete file from filesystem: ${filePath}`, unlinkErr);
                }
            });

            res.json({ message: 'File deleted successfully' });
        });
    });
});

module.exports = router;
