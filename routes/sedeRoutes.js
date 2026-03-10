const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const sedeController = require('../controllers/sedeController');

// Todas las rutas requieren autenticación
router.use(authMiddleware.isAuthenticated);

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