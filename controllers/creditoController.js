const Credito = require('../models/CreditoModel');
const Cliente = require('../models/ClienteModel');
const Cobrador = require('../models/CobradorModel');
const db = require('../config/mysql');


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


exports.pagarCredito = async (req, res) => {
    try {
        const { id } = req.params;

        // Validar que el id existe
        if (!id) {
            return res.status(400).json({
                ok: false,
                message: 'ID de crédito no proporcionado'
            });
        }

        // Verificar que el crédito existe
        const credito = await Credito.obtenerPorId(id);

        if (!credito) {
            return res.status(404).json({
                ok: false,
                message: 'Crédito no encontrado'
            });
        }

        // Verificar que el crédito no esté ya pagado
        if (credito.estado === 'pagado') {
            return res.status(400).json({
                ok: false,
                message: 'El crédito ya se encuentra pagado'
            });
        }

        // Actualizar el estado a 'pagado'
        await Credito.actualizarEstado(id, 'pagado');

        return res.status(200).json({
            ok: true,
            message: 'Crédito pagado exitosamente'
        });

    } catch (error) {
        console.error('Error al pagar crédito:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error interno del servidor'
        });
    }
};

// También podrías agregar un método para pagar y actualizar la fecha de pago
exports.pagarCreditoConFecha = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_pago } = req.body; // Fecha de pago actual (opcional, usaría la actual por defecto)

        // Validar que el id existe
        if (!id) {
            return res.status(400).json({
                ok: false,
                message: 'ID de crédito no proporcionado'
            });
        }

        // Verificar que el crédito existe
        const credito = await Credito.obtenerPorId(id);

        if (!credito) {
            return res.status(404).json({
                ok: false,
                message: 'Crédito no encontrado'
            });
        }

        // Verificar que el crédito no esté ya pagado
        if (credito.estado === 'pagado') {
            return res.status(400).json({
                ok: false,
                message: 'El crédito ya se encuentra pagado'
            });
        }

        const query = 'UPDATE creditos SET estado = ?, fecha_pago = ? WHERE id_credito = ?';
        const fechaActual = fecha_pago || new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

        await db.query(query, ['pagado', fechaActual, id]);

        return res.status(200).json({
            ok: true,
            message: 'Crédito pagado exitosamente',
            fecha_pago: fechaActual
        });

    } catch (error) {
        console.error('Error al pagar crédito:', error);
        return res.status(500).json({
            ok: false,
            message: 'Error interno del servidor'
        });
    }
};


exports.obtenerCreditosPorCobrador = async (req, res) => {
    try {
        const { id_cobrador } = req.params;

        // Validar que el id existe
        if (!id_cobrador) {
            return res.status(400).json({
                ok: false,
                message: 'ID de cobrador no proporcionado'
            });
        }

        // Verificar que el cobrador existe
        const cobrador = await Cobrador.obtenerPorId(id_cobrador, true); // true para incluir inactivos
        if (!cobrador) {
            return res.status(404).json({
                ok: false,
                message: 'Cobrador no encontrado'
            });
        }

        // Obtener todos los créditos del cobrador
        const creditos = await Credito.obtenerPorCobradorConDetalles(id_cobrador);

        // Obtener estadísticas
        const estadisticas = await Credito.obtenerEstadisticasPorCobrador(id_cobrador);

        res.json({
            ok: true,
            data: {
                cobrador: {
                    id: cobrador.id_cobrador,
                    nombre: cobrador.nombre,
                    apellidos: cobrador.apellidos,
                    cedula: cobrador.cedula,
                    celular: cobrador.celular,
                    activo: cobrador.activo
                },
                estadisticas,
                creditos
            }
        });

    } catch (error) {
        console.error('Error al obtener créditos por cobrador:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};