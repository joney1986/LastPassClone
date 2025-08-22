const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const db = require('../database.js');
const auth = require('../middleware/auth');

const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET;

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

        if (row.two_fa_enabled) {
            // 2FA is enabled, issue a temporary token
            const tempToken = jwt.sign({ id: row.id, username: row.username, type: '2fa' }, jwtSecret, { expiresIn: '5m' });
            res.json({
                message: "2FA required",
                twoFactorRequired: true,
                tempToken: tempToken
            });
        } else {
            // 2FA is not enabled, issue final token
            const token = jwt.sign({ id: row.id, username: row.username }, jwtSecret, { expiresIn: '1h' });
            res.json({
                message: "success",
                token: token
            });
        }
      });
    });
  });

// Middleware for verifying the temporary 2FA token
const auth2fa = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, jwtSecret);
      if (decoded.type !== '2fa') {
        return res.status(401).json({ error: 'Invalid token type for 2FA' });
      }
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired temporary token' });
    }
};

// 2FA Login
router.post('/2fa/login', auth2fa, body('token').notEmpty(), (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;
    const userId = req.user.id;

    const sql = 'SELECT two_fa_secret FROM users WHERE id = ?';
    db.get(sql, [userId], (err, row) => {
        if (err || !row || !row.two_fa_secret) {
            return res.status(500).json({ error: 'Could not find 2FA secret for user.' });
        }

        const verified = speakeasy.totp.verify({
            secret: row.two_fa_secret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (verified) {
            const finalToken = jwt.sign({ id: req.user.id, username: req.user.username }, jwtSecret, { expiresIn: '1h' });
            res.json({ message: 'Login successful', token: finalToken });
        } else {
            res.status(400).json({ error: 'Invalid 2FA token.' });
        }
    });
});

// 2FA Setup
router.post('/2fa/setup', auth, (req, res) => {
    const secret = speakeasy.generateSecret({
        name: `LastPassClone (${req.user.username})`
    });

    const sql = 'UPDATE users SET two_fa_secret = ? WHERE id = ?';
    db.run(sql, [secret.base32, req.user.id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save 2FA secret.' });
        }

        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to generate QR code.' });
            }
            res.json({ qrCodeUrl: data_url, secret: secret.base32 });
        });
    });
});

// 2FA Verify
router.post('/2fa/verify', auth, body('token').notEmpty(), (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;
    const userId = req.user.id;

    const sql = 'SELECT two_fa_secret FROM users WHERE id = ?';
    db.get(sql, [userId], (err, row) => {
        if (err || !row || !row.two_fa_secret) {
            return res.status(500).json({ error: 'Could not find 2FA secret for user.' });
        }

        const verified = speakeasy.totp.verify({
            secret: row.two_fa_secret,
            encoding: 'base32',
            token: token,
        });

        if (verified) {
            const updateSql = 'UPDATE users SET two_fa_enabled = 1 WHERE id = ?';
            db.run(updateSql, [userId], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to enable 2FA.' });
                }
                res.json({ message: '2FA enabled successfully.' });
            });
        } else {
            res.status(400).json({ error: 'Invalid 2FA token.' });
        }
    });
});

// 2FA Disable
router.post('/2fa/disable', auth, (req, res) => {
    const updateSql = 'UPDATE users SET two_fa_enabled = 0, two_fa_secret = NULL WHERE id = ?';
    db.run(updateSql, [req.user.id], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to disable 2FA.' });
        }
        res.json({ message: '2FA disabled successfully.' });
    });
});


module.exports = router;
