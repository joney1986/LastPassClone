const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const db = require('../database.js');

const saltRounds = 10;
// In a real application, this secret should be stored in an environment variable
const jwtSecret = 'your_super_secret_key';

// Rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
});


/* POST user registration. */
router.post('/register',
  body('username').notEmpty().trim().escape(),
  body('password').isLength({ min: 8 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Error hashing password' });
      }

      const sql = 'INSERT INTO users (username, password) VALUES (?,?)';
      const params = [username, hash];
      db.run(sql, params, function (err, result) {
        if (err) {
          res.status(400).json({ "error": err.message })
          return;
        }
        res.json({
          "message": "success",
          "data": { id: this.lastID, username: username },
        })
      });
    });
  });

/* POST user login. */
router.post('/login',
  loginLimiter,
  body('username').notEmpty().trim().escape(),
  body('password').notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    const sql = "select * from users where username = ?";
    const params = [username];
    db.get(sql, params, (err, row) => {
      if (err) {
        res.status(400).json({ "error": err.message });
        return;
      }

      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }

      bcrypt.compare(password, row.password, (err, result) => {
        if (err || !result) {
          return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ id: row.id, username: row.username }, jwtSecret, { expiresIn: '1h' });
        res.json({
          "message": "success",
          "token": token
        })
      });
    });
  });

module.exports = router;
