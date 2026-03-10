const db = require('../config/mysql');

const Sede = {
    // Obtener todas las sedes activas
    getAll: async () => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM sedes WHERE activo = 1 ORDER BY nombre_sede'
            );
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Obtener todas las sedes (incluyendo inactivas)
    getAllAdmin: async () => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM sedes ORDER BY nombre_sede'
            );
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Obtener sede por ID
    getById: async (id) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM sedes WHERE id_sede = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Crear nueva sede
    create: async (sedeData) => {
        try {
            const { nombre_sede, direccion, telefono } = sedeData;
            
            const [result] = await db.query(
                'INSERT INTO sedes (nombre_sede, direccion, telefono, created_at, activo) VALUES (?, ?, ?, NOW(), 1)',
                [nombre_sede, direccion, telefono]
            );
            
            return result.insertId;
        } catch (error) {
            throw error;
        }
    },

    // Actualizar sede
    update: async (id, sedeData) => {
        try {
            const { nombre_sede, direccion, telefono } = sedeData;
            
            const [result] = await db.query(
                'UPDATE sedes SET nombre_sede = ?, direccion = ?, telefono = ? WHERE id_sede = ?',
                [nombre_sede, direccion, telefono, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    // Eliminar (borrado lógico)
    delete: async (id) => {
        try {
            const [result] = await db.query(
                'UPDATE sedes SET activo = 0 WHERE id_sede = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    // Activar sede
    activate: async (id) => {
        try {
            const [result] = await db.query(
                'UPDATE sedes SET activo = 1 WHERE id_sede = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    // Verificar si existe nombre de sede
    existsByName: async (nombre, excludeId = null) => {
        try {
            let query = 'SELECT COUNT(*) as count FROM sedes WHERE nombre_sede = ?';
            let params = [nombre];
            
            if (excludeId) {
                query += ' AND id_sede != ?';
                params.push(excludeId);
            }
            
            const [rows] = await db.query(query, params);
            return rows[0].count > 0;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Sede;