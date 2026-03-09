const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas de autenticación
router.get('/login', authMiddleware.isLoggedIn, authController.showLoginForm);
router.post('/login', authController.login);
router.get('/dashboard', authMiddleware.isAuthenticated, authController.dashboard);
router.get('/logout', authController.logout);

module.exports = router;