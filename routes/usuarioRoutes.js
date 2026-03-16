const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const usuarioController = require('../controllers/usuarioController');
const authJWT = require('../middleware/authJWT');


router.post('/login', authController.login);

router.get('/dashboard',
    authJWT.verificarToken,
    authController.dashboard
);

router.get('/logout', authController.logout);

// Rutas CRUD USERS
router.get('/usuarios/admin/all', usuarioController.getAll);
router.get('/usuarios/:id', usuarioController.getById);
router.post('/usuarios', usuarioController.create);
router.put('/usuarios/:id', usuarioController.update);
router.delete('/usuarios/:id', usuarioController.delete);
router.patch('/usuarios/:id/activate', usuarioController.activate);

module.exports = router;