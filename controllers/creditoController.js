const Credito = require('../models/CreditoModel');
const Cliente = require('../models/ClienteModel');
const Cobrador = require('../models/CobradorModel');

exports.crearCredito = async (req, res) => {
    try {
        const { fecha_credito, fecha_pago, monto_prestado, monto_por_pagar, id_cliente, id_cobrador, estado } = req.body;

        // Validaciones
        if (!fecha_credito || !monto_prestado || !monto_por_pagar || !id_cliente || !id_cobrador) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Verificar que el cliente existe
        const cliente = await Cliente.obtenerPorId(id_cliente);
        if (!cliente) {
            return res.status(404).json({ error: 'El cliente no existe o está inactivo' });
        }

        // Verificar que el cobrador existe
        const cobrador = await Cobrador.obtenerPorId(id_cobrador);
        if (!cobrador) {
            return res.status(404).json({ error: 'El cobrador no existe o está inactivo' });
        }

        const id = await Credito.crear({
            fecha_credito,
            fecha_pago,
            monto_prestado,
            monto_por_pagar,
            id_cliente,
            id_cobrador,
            estado
        });

        res.status(201).json({ message: 'Crédito creado exitosamente', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.creditosPorCliente = async (req, res) => {
    try {
        const { id_cliente } = req.params;

        // Verificar que el cliente existe
        const cliente = await Cliente.obtenerPorId(id_cliente);
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const creditos = await Credito.obtenerPorCliente(id_cliente);
        res.json(creditos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.obtenerTodos = async (req, res) => {
    try {
        const creditos = await Credito.obtenerTodos();

        return res.status(200).json({
            ok: true,
            total: creditos.length,
            data: creditos
        });

    } catch (error) {
        console.error('Error obteniendo créditos:', error);

        return res.status(500).json({
            ok: false,
            message: 'Error interno del servidor'
        });
    }
};