const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Obtener todos los clientes
router.get('/', clienteController.obtenerClientes);

// Obtener un cliente por ID
router.get('/:id', clienteController.obtenerClientePorId);

// Crear nuevo cliente
router.post('/', clienteController.crearCliente);

// Actualizar cliente
router.put('/:id', clienteController.actualizarCliente);

// Eliminar cliente
router.delete('/:id', clienteController.eliminarCliente);

// Obtener clientes por cobrador
router.get('/cobrador/:id_cobrador', clienteController.clientesPorCobrador);

module.exports = router;