const express = require('express');
const { signup, login, logout } = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;

