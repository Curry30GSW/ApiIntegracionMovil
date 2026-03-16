const express = require('express');
const router = express.Router();
const sedeController = require('../controllers/sedeController');

const authJWT = require('../middleware/authJWT');

// Middleware global para todas las rutas
router.use(authJWT.verificarToken);
router.use(authJWT.getSede);
router.use(authJWT.esAdmin);

// Rutas públicas (usuarios autenticados)
router.get('/', sedeController.getAll);
router.get('/:id', sedeController.getById);

// Rutas de administración (solo admin)
router.get('/admin/all', authJWT.esAdmin, sedeController.getAllAdmin);
router.post('/', authJWT.esAdmin, sedeController.create);
router.put('/:id', authJWT.esAdmin, sedeController.update);
router.delete('/:id', authJWT.esAdmin, sedeController.delete);
router.patch('/:id/activate', authJWT.esAdmin, sedeController.activate);

module.exports = router;