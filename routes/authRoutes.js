const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register', register); // optionally protected to admins only in production
router.post('/login', login);

module.exports = router;
