const express = require('express');
const router = express.Router();
const creditoController = require('../controllers/creditoController');

router.post('/', creditoController.crearCredito);
router.get('/', creditoController.obtenerTodos);
router.get('/cliente/:id_cliente', creditoController.creditosPorCliente);

module.exports = router;