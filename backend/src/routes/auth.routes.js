const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../middleware/validators');
const { handleValidationErrors } = require('../middleware/validation');

// POST /api/auth/register
router.post('/register', registerValidation, handleValidationErrors, register);

// POST /api/auth/login
router.post('/login', loginValidation, handleValidationErrors, login);

module.exports = router;
