const Cliente = require('../models/Cliente');
const Cobrador = require('../models/Cobrador');

exports.crearCliente = async (req, res) => {
    try {
        const { cedula, nombre, apellidos, direccion, celular, id_cobrador } = req.body;

        // Validaciones
        if (!cedula || !nombre || !apellidos || !celular || !id_cobrador) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Verificar que el cobrador existe
        const cobrador = await Cobrador.obtenerPorId(id_cobrador);
        if (!cobrador) {
            return res.status(404).json({ error: 'El cobrador no existe' });
        }

        const id = await Cliente.crear({ cedula, nombre, apellidos, direccion, celular, id_cobrador });
        res.status(201).json({ message: 'Cliente creado exitosamente', id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'La cédula ya está registrada' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

exports.clientesPorCobrador = async (req, res) => {
    try {
        const { id_cobrador } = req.params;

        // Verificar que el cobrador existe
        const cobrador = await Cobrador.obtenerPorId(id_cobrador);
        if (!cobrador) {
            return res.status(404).json({ error: 'Cobrador no encontrado' });
        }

        const clientes = await Cliente.obtenerPorCobrador(id_cobrador);
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};