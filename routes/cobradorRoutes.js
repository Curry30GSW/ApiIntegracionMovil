const express = require('express');
const router = express.Router();
const cobradorController = require('../controllers/cobradorController');

router.post('/', cobradorController.crearCobrador);
router.get('/', cobradorController.obtenerCobradores);

module.exports = router;