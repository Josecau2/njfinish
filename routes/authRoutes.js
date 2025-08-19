const express = require('express');
const { signup, login } = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

module.exports = router;
