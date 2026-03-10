const Cliente = require('../models/ClienteModel');
const Cobrador = require('../models/CobradorModel');

exports.crearCliente = async (req, res) => {
    try {

        const id_sede = req.id_sede;

        const { cedula, nombre, apellidos, direccion, celular, id_cobrador } = req.body;

        if (!cedula || !nombre || !apellidos || !celular || !id_cobrador) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const cobrador = await Cobrador.obtenerPorId(id_cobrador, id_sede);
        if (!cobrador) {
            return res.status(404).json({ error: 'El cobrador no existe' });
        }

        const id = await Cliente.crear({
            cedula,
            nombre,
            apellidos,
            direccion,
            celular,
            id_cobrador,
            id_sede
        });

        res.status(201).json({
            message: 'Cliente creado exitosamente',
            id
        });

    } catch (error) {

        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'La cédula ya está registrada' });
        } else {
            res.status(500).json({ error: error.message });
        }

    }
};

exports.obtenerClientes = async (req, res) => {
    try {

        const id_sede = req.id_sede;

        const clientes = await Cliente.obtenerTodos(id_sede);

        res.json({
            ok: true,
            total: clientes.length,
            data: clientes
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerClientePorId = async (req, res) => {
    try {

        const { id } = req.params;
        const id_sede = req.id_sede;

        const cliente = await Cliente.obtenerPorId(id, id_sede);

        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json(cliente);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.actualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { cedula, nombre, apellidos, direccion, celular, id_cobrador } = req.body;

        // Verificar que el cliente existe
        const clienteExistente = await Cliente.obtenerPorId(id);
        if (!clienteExistente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        // Verificar que el cobrador existe
        const cobrador = await Cobrador.obtenerPorId(id_cobrador);
        if (!cobrador) {
            return res.status(404).json({ error: 'El cobrador no existe' });
        }

        await Cliente.actualizar(id, { cedula, nombre, apellidos, direccion, celular, id_cobrador });
        res.json({ message: 'Cliente actualizado exitosamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'La cédula ya está registrada' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

exports.eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el cliente existe
        const cliente = await Cliente.obtenerPorId(id);
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        await Cliente.eliminar(id);
        res.json({ message: 'Cliente eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.clientesPorCobrador = async (req, res) => {
    try {

        const { id_cobrador } = req.params;
        const id_sede = req.id_sede;

        const cobrador = await Cobrador.obtenerPorId(id_cobrador);
        if (!cobrador) {
            return res.status(404).json({ error: 'Cobrador no encontrado' });
        }

        const clientes = await Cliente.obtenerPorCobrador(id_cobrador, id_sede);

        res.json(clientes);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};