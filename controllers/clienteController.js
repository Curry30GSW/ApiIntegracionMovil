const Cliente = require('../models/ClienteModel');
const Cobrador = require('../models/CobradorModel');

exports.crearCliente = async (req, res) => {
    try {
        const id_sede = req.id_sede;
        const { cedula, nombre, apellidos, direccion, celular, id_cobrador } = req.body;

        if (!cedula || !nombre || !apellidos || !celular) {
            return res.status(400).json({
                ok: false,
                error: 'Faltan campos requeridos'
            });
        }

        // Verificar que el cobrador existe (si se proporciona)
        if (id_cobrador) {
            const cobrador = await Cobrador.obtenerPorId(id_cobrador, id_sede);
            if (!cobrador) {
                return res.status(404).json({
                    ok: false,
                    error: 'El cobrador no existe o no pertenece a esta sede'
                });
            }
        }

        const id = await Cliente.crear({
            cedula,
            nombre,
            apellidos,
            direccion,
            celular,
            id_cobrador: id_cobrador || null,
            id_sede
        });

        res.status(201).json({
            ok: true,
            message: 'Cliente creado exitosamente',
            id
        });

    } catch (error) {
        console.error('Error al crear cliente:', error);

        // PostgreSQL error codes
        // 23505 = unique violation
        if (error.code === '23505') {
            // Verificar cuál restricción se violó
            if (error.constraint === 'clientes_cedula_key') {
                res.status(400).json({
                    ok: false,
                    error: 'La cédula ya está registrada'
                });
            } else {
                res.status(400).json({
                    ok: false,
                    error: 'Error de duplicación'
                });
            }
        } else {
            res.status(500).json({
                ok: false,
                error: error.message
            });
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
        console.error('Error al obtener clientes:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};

exports.obtenerClientePorId = async (req, res) => {
    try {
        const { id } = req.params;
        const id_sede = req.id_sede;

        const cliente = await Cliente.obtenerPorId(id, id_sede);

        if (!cliente) {
            return res.status(404).json({
                ok: false,
                error: 'Cliente no encontrado'
            });
        }

        res.json({
            ok: true,
            data: cliente
        });
    } catch (error) {
        console.error('Error al obtener cliente:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};

exports.actualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const id_sede = req.id_sede;
        const { cedula, nombre, apellidos, direccion, celular, id_cobrador } = req.body;

        // Verificar que el cliente existe
        const clienteExistente = await Cliente.obtenerPorId(id, id_sede);
        if (!clienteExistente) {
            return res.status(404).json({
                ok: false,
                error: 'Cliente no encontrado'
            });
        }

        // Verificar que el cobrador existe (si se proporciona)
        if (id_cobrador) {
            const cobrador = await Cobrador.obtenerPorId(id_cobrador, id_sede);
            if (!cobrador) {
                return res.status(404).json({
                    ok: false,
                    error: 'El cobrador no existe o no pertenece a esta sede'
                });
            }
        }

        const actualizado = await Cliente.actualizar(id, {
            cedula,
            nombre,
            apellidos,
            direccion,
            celular,
            id_cobrador: id_cobrador || null
        }, id_sede);

        if (actualizado) {
            res.json({
                ok: true,
                message: 'Cliente actualizado exitosamente'
            });
        } else {
            res.status(400).json({
                ok: false,
                error: 'No se pudo actualizar el cliente'
            });
        }
    } catch (error) {
        console.error('Error al actualizar cliente:', error);

        if (error.code === '23505') {
            res.status(400).json({
                ok: false,
                error: 'La cédula ya está registrada'
            });
        } else {
            res.status(500).json({
                ok: false,
                error: error.message
            });
        }
    }
};

exports.eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const id_sede = req.id_sede;

        // Verificar que el cliente existe
        const cliente = await Cliente.obtenerPorId(id, id_sede);
        if (!cliente) {
            return res.status(404).json({
                ok: false,
                error: 'Cliente no encontrado'
            });
        }

        const eliminado = await Cliente.eliminar(id, id_sede);

        if (eliminado) {
            res.json({
                ok: true,
                message: 'Cliente eliminado exitosamente'
            });
        } else {
            res.status(400).json({
                ok: false,
                error: 'No se pudo eliminar el cliente'
            });
        }
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};

exports.clientesPorCobrador = async (req, res) => {
    try {
        const { id_cobrador } = req.params;
        const id_sede = req.id_sede;

        const cobrador = await Cobrador.obtenerPorId(id_cobrador, id_sede);
        if (!cobrador) {
            return res.status(404).json({
                ok: false,
                error: 'Cobrador no encontrado'
            });
        }

        const clientes = await Cliente.obtenerPorCobrador(id_cobrador, id_sede);

        res.json({
            ok: true,
            total: clientes.length,
            data: clientes
        });
    } catch (error) {
        console.error('Error al obtener clientes por cobrador:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};