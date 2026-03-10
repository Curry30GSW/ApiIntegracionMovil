const Sede = require('../models/sedeModel');

const sedeController = {
    // Obtener todas las sedes activas
    getAll: async (req, res) => {
        try {
            const sedes = await Sede.getAll();
            
            res.json({
                success: true,
                data: sedes
            });
        } catch (error) {
            console.error('Error al obtener sedes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las sedes'
            });
        }
    },

    // Obtener todas las sedes (admin)
    getAllAdmin: async (req, res) => {
        try {
            // Solo admin puede ver todas (incluyendo inactivas)
            if (req.session.user.rol !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado'
                });
            }

            const sedes = await Sede.getAllAdmin();
            
            res.json({
                success: true,
                data: sedes
            });
        } catch (error) {
            console.error('Error al obtener sedes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las sedes'
            });
        }
    },

    // Obtener sede por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const sede = await Sede.getById(id);
            
            if (!sede) {
                return res.status(404).json({
                    success: false,
                    message: 'Sede no encontrada'
                });
            }

            res.json({
                success: true,
                data: sede
            });
        } catch (error) {
            console.error('Error al obtener sede:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener la sede'
            });
        }
    },

    // Crear nueva sede
    create: async (req, res) => {
        try {
            // Solo admin puede crear sedes
            if (req.session.user.rol !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado'
                });
            }

            const { nombre_sede, direccion, telefono } = req.body;

            // Validaciones
            if (!nombre_sede || !direccion || !telefono) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
            }

            // Verificar si ya existe una sede con ese nombre
            const exists = await Sede.existsByName(nombre_sede);
            if (exists) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una sede con ese nombre'
                });
            }

            const id = await Sede.create({
                nombre_sede,
                direccion,
                telefono
            });

            const newSede = await Sede.getById(id);

            res.status(201).json({
                success: true,
                message: 'Sede creada exitosamente',
                data: newSede
            });
        } catch (error) {
            console.error('Error al crear sede:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear la sede'
            });
        }
    },

    // Actualizar sede
    update: async (req, res) => {
        try {
            // Solo admin puede actualizar sedes
            if (req.session.user.rol !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado'
                });
            }

            const { id } = req.params;
            const { nombre_sede, direccion, telefono } = req.body;

            // Validaciones
            if (!nombre_sede || !direccion || !telefono) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
            }

            // Verificar si la sede existe
            const sede = await Sede.getById(id);
            if (!sede) {
                return res.status(404).json({
                    success: false,
                    message: 'Sede no encontrada'
                });
            }

            // Verificar si ya existe otra sede con ese nombre
            if (nombre_sede !== sede.nombre_sede) {
                const exists = await Sede.existsByName(nombre_sede, id);
                if (exists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe otra sede con ese nombre'
                    });
                }
            }

            const updated = await Sede.update(id, {
                nombre_sede,
                direccion,
                telefono
            });

            if (updated) {
                const updatedSede = await Sede.getById(id);
                res.json({
                    success: true,
                    message: 'Sede actualizada exitosamente',
                    data: updatedSede
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo actualizar la sede'
                });
            }
        } catch (error) {
            console.error('Error al actualizar sede:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar la sede'
            });
        }
    },

    // Eliminar (borrado lógico)
    delete: async (req, res) => {
        try {
            // Solo admin puede eliminar sedes
            if (req.session.user.rol !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado'
                });
            }

            const { id } = req.params;

            // Verificar si la sede existe
            const sede = await Sede.getById(id);
            if (!sede) {
                return res.status(404).json({
                    success: false,
                    message: 'Sede no encontrada'
                });
            }

            const deleted = await Sede.delete(id);

            if (deleted) {
                res.json({
                    success: true,
                    message: 'Sede eliminada exitosamente'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo eliminar la sede'
                });
            }
        } catch (error) {
            console.error('Error al eliminar sede:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar la sede'
            });
        }
    },

    // Activar sede
    activate: async (req, res) => {
        try {
            // Solo admin puede activar sedes
            if (req.session.user.rol !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado'
                });
            }

            const { id } = req.params;

            const sede = await Sede.getById(id);
            if (!sede) {
                return res.status(404).json({
                    success: false,
                    message: 'Sede no encontrada'
                });
            }

            const activated = await Sede.activate(id);

            if (activated) {
                res.json({
                    success: true,
                    message: 'Sede activada exitosamente'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo activar la sede'
                });
            }
        } catch (error) {
            console.error('Error al activar sede:', error);
            res.status(500).json({
                success: false,
                message: 'Error al activar la sede'
            });
        }
    }
};

module.exports = sedeController;