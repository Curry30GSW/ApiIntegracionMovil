const express = require('express');
const router = express.Router();
const sedeController = require('../controllers/sedeController');

const authJWT = require('../middleware/authJWT');

// Middleware global para todas las rutas
router.use(authJWT.verificarToken);
router.use(authJWT.getSede);

// Rutas públicas (usuarios autenticados)
router.get('/', sedeController.getAll);
router.get('/:id', sedeController.getById);

// Rutas de administración (solo admin)
router.get('/admin/all', authMiddleware.isAdmin, sedeController.getAllAdmin);
router.post('/', authMiddleware.isAdmin, sedeController.create);
router.put('/:id', authMiddleware.isAdmin, sedeController.update);
router.delete('/:id', authMiddleware.isAdmin, sedeController.delete);
router.patch('/:id/activate', authMiddleware.isAdmin, sedeController.activate);

module.exports = router;