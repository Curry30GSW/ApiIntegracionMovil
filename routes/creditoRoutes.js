const express = require('express');
const router = express.Router();
const creditoController = require('../controllers/creditoController');
const authJWT = require('../middleware/authJWT');

// Middleware global para todas las rutas
router.use(authJWT.verificarToken);
router.use(authJWT.getSede);

/* =========================
   RUTAS ESPECÍFICAS PRIMERO
========================= */

// Rutas con prefijos fijos (más específicas)
router.get('/cliente/:id_cliente', creditoController.creditosPorCliente);
router.get('/cobrador/:id_cobrador', creditoController.obtenerCreditosPorCobrador);
router.put('/pagar/:id', creditoController.pagarCreditoConFecha);

/* =========================
   RUTAS GENÉRICAS DESPUÉS
========================= */

// Rutas base
router.get('/', creditoController.obtenerTodos);
router.post('/', creditoController.crearCredito);

// Si tuvieras ruta por ID específico, iría aquí
// router.get('/:id', creditoController.obtenerPorId);

module.exports = router;