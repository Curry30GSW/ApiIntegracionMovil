const express = require('express');
const router = express.Router();
const cobradorController = require('../controllers/cobradorController');

// Obtener todos los cobradores
router.get('/', cobradorController.obtenerCobradores);

// Obtener un cobrador por ID
router.get('/:id', cobradorController.obtenerCobradorPorId);

// Crear nuevo cobrador
router.post('/', cobradorController.crearCobrador);

// Actualizar cobrador
router.put('/:id', cobradorController.actualizarCobrador);

// Eliminar cobrador
router.delete('/:id', cobradorController.eliminarCobrador);

// Obtener estadísticas de cobradores
router.get('/estadisticas/all', cobradorController.obtenerEstadisticas);

module.exports = router;