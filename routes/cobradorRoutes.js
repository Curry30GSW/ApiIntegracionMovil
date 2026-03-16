const express = require('express');
const router = express.Router();
const cobradorController = require('../controllers/cobradorController');
const authJWT = require('../middleware/authJWT');

// Middleware global para todas las rutas
router.use(authJWT.verificarToken);
router.use(authJWT.getSede);

// ✅ Rutas ESPECÍFICAS primero
router.get('/estadisticas/all', cobradorController.obtenerEstadisticas);
router.patch('/:id/reactivar', cobradorController.reactivarCobrador);

// ✅ Luego rutas con parámetros
router.get('/', cobradorController.obtenerCobradores);
router.get('/:id', cobradorController.obtenerCobradorPorId);

// ✅ Finalmente rutas de acción
router.post('/', cobradorController.crearCobrador);
router.put('/:id', cobradorController.actualizarCobrador);
router.delete('/:id', cobradorController.eliminarCobrador);

module.exports = router;