const express = require('express');
const router = express.Router();
const creditoController = require('../controllers/creditoController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware global para todas las rutas
router.use(authMiddleware.isAuthenticated);
router.use(authMiddleware.getSede);

// Crear crédito
router.post('/', creditoController.crearCredito);

// Obtener todos los créditos
router.get('/', creditoController.obtenerTodos);

// Créditos por cliente
router.get('/cliente/:id_cliente', creditoController.creditosPorCliente);

// Pagar crédito
router.put('/pagar/:id', creditoController.pagarCreditoConFecha);

// Créditos por cobrador
router.get('/cobrador/:id_cobrador', creditoController.obtenerCreditosPorCobrador);

module.exports = router;