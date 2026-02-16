const Credito = require('../models/Credito');
const Cliente = require('../models/Cliente');
const Cobrador = require('../models/Cobrador');

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
            return res.status(404).json({ error: 'El cliente no existe' });
        }

        // Verificar que el cobrador existe
        const cobrador = await Cobrador.obtenerPorId(id_cobrador);
        if (!cobrador) {
            return res.status(404).json({ error: 'El cobrador no existe' });
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