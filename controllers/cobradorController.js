const Cobrador = require('../models/CobradorModel');

exports.crearCobrador = async (req, res) => {
    try {
        const id_sede = req.id_sede;
        const { nombre, apellidos, celular, direccion, cedula } = req.body;

        // Validaciones básicas
        if (!nombre || !apellidos || !celular || !cedula) {
            return res.status(400).json({
                ok: false,
                error: 'Faltan campos requeridos'
            });
        }

        // Verificar si ya existe un cobrador activo con la misma cédula en la sede
        const existente = await Cobrador.buscarPorCedula(cedula, id_sede);
        if (existente) {
            return res.status(400).json({
                ok: false,
                error: 'La cédula ya está registrada con un cobrador activo en esta sede'
            });
        }

        const id = await Cobrador.crear({ 
            nombre, 
            apellidos, 
            celular, 
            direccion, 
            cedula,
            id_sede 
        });
        
        res.status(201).json({
            ok: true,
            message: 'Cobrador creado exitosamente',
            id
        });
    } catch (error) {
        console.error('Error al crear cobrador:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};

exports.obtenerCobradores = async (req, res) => {
    try {
        const id_sede = req.id_sede;
        // Parámetro opcional para incluir inactivos (solo para admin)
        const includeInactive = req.query.includeInactive === 'true';
        const cobradores = await Cobrador.obtenerTodos(id_sede, includeInactive);

        res.json({
            ok: true,
            total: cobradores.length,
            data: cobradores
        });
    } catch (error) {
        console.error('Error al obtener cobradores:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};

exports.obtenerCobradorPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const id_sede = req.id_sede;
        const includeInactive = req.query.includeInactive === 'true';
        
        const cobrador = await Cobrador.obtenerPorId(id, id_sede, includeInactive);

        if (!cobrador) {
            return res.status(404).json({
                ok: false,
                error: 'Cobrador no encontrado o inactivo'
            });
        }

        res.json({
            ok: true,
            data: cobrador
        });
    } catch (error) {
        console.error('Error al obtener cobrador:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};

exports.actualizarCobrador = async (req, res) => {
    try {
        const { id } = req.params;
        const id_sede = req.id_sede;
        const { nombre, apellidos, celular, direccion, cedula } = req.body;

        // Verificar que el cobrador existe y está activo en la sede
        const cobradorExistente = await Cobrador.obtenerPorId(id, id_sede);
        if (!cobradorExistente) {
            return res.status(404).json({
                ok: false,
                error: 'Cobrador no encontrado o inactivo'
            });
        }

        // Verificar si la nueva cédula ya está en uso por otro cobrador activo en la sede
        if (cedula && cedula !== cobradorExistente.cedula) {
            const cobradorConCedula = await Cobrador.buscarPorCedula(cedula, id_sede);
            if (cobradorConCedula && cobradorConCedula.id_cobrador !== parseInt(id)) {
                return res.status(400).json({
                    ok: false,
                    error: 'La cédula ya está registrada con otro cobrador activo en esta sede'
                });
            }
        }

        const actualizado = await Cobrador.actualizar(id, { 
            nombre, 
            apellidos, 
            celular, 
            direccion, 
            cedula 
        });

        if (actualizado) {
            res.json({
                ok: true,
                message: 'Cobrador actualizado exitosamente'
            });
        } else {
            res.status(400).json({
                ok: false,
                error: 'No se pudo actualizar el cobrador'
            });
        }
    } catch (error) {
        console.error('Error al actualizar cobrador:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};

exports.eliminarCobrador = async (req, res) => {
    try {
        const { id } = req.params;
        const id_sede = req.id_sede;

        // Verificar que el cobrador existe y está activo en la sede
        const cobrador = await Cobrador.obtenerPorId(id, id_sede);
        if (!cobrador) {
            return res.status(404).json({
                ok: false,
                error: 'Cobrador no encontrado o ya está inactivo'
            });
        }

        const eliminado = await Cobrador.eliminar(id);

        if (eliminado) {
            res.json({
                ok: true,
                message: 'Cobrador desactivado exitosamente'
            });
        } else {
            res.status(400).json({
                ok: false,
                error: 'No se pudo desactivar el cobrador'
            });
        }
    } catch (error) {
        console.error('Error al eliminar cobrador:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};

exports.reactivarCobrador = async (req, res) => {
    try {
        const { id } = req.params;
        const id_sede = req.id_sede;

        const reactivado = await Cobrador.reactivar(id, id_sede);

        if (reactivado) {
            res.json({
                ok: true,
                message: 'Cobrador reactivado exitosamente'
            });
        } else {
            res.status(404).json({
                ok: false,
                error: 'Cobrador no encontrado'
            });
        }
    } catch (error) {
        console.error('Error al reactivar cobrador:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};

exports.obtenerEstadisticas = async (req, res) => {
    try {
        const id_sede = req.id_sede;
        const includeInactive = req.query.includeInactive === 'true';
        const cobradores = await Cobrador.obtenerConEstadisticas(id_sede, includeInactive);

        res.json({
            ok: true,
            data: cobradores
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
};