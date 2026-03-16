const db = require('../config/database');

class Sede {
    // Obtener todas las sedes activas
    static async getAll() {
        try {
            const result = await db.query(
                'SELECT * FROM sedes WHERE activo = 1 ORDER BY nombre_sede'
            );
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    // Obtener todas las sedes (incluyendo inactivas)
    static async getAllAdmin() {
        try {
            const result = await db.query(
                'SELECT * FROM sedes ORDER BY nombre_sede'
            );
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    // Obtener sede por ID
    static async getById(id) {
        try {
            const result = await db.query(
                'SELECT * FROM sedes WHERE id_sede = $1',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Crear nueva sede
    static async create(sedeData) {
        try {
            const { nombre_sede, direccion, telefono } = sedeData;

            const result = await db.query(
                'INSERT INTO sedes (nombre_sede, direccion, telefono, created_at, activo) VALUES ($1, $2, $3, NOW(), $4) RETURNING id_sede',
                [nombre_sede, direccion, telefono, 1]
            );

            return result.rows[0].id_sede;
        } catch (error) {
            throw error;
        }
    }

    // Actualizar sede
    static async update(id, sedeData) {
        try {
            const { nombre_sede, direccion, telefono } = sedeData;

            const result = await db.query(
                'UPDATE sedes SET nombre_sede = $1, direccion = $2, telefono = $3 WHERE id_sede = $4 RETURNING id_sede',
                [nombre_sede, direccion, telefono, id]
            );

            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar (borrado lógico)
    static async delete(id) {
        try {
            const result = await db.query(
                'UPDATE sedes SET activo = 0 WHERE id_sede = $1 RETURNING id_sede',
                [id]
            );
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    // Activar sede
    static async activate(id) {
        try {
            const result = await db.query(
                'UPDATE sedes SET activo = 1 WHERE id_sede = $1 RETURNING id_sede',
                [id]
            );
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    // Verificar si existe nombre de sede
    static async existsByName(nombre, excludeId = null) {
        try {
            let query = 'SELECT COUNT(*) as count FROM sedes WHERE nombre_sede = $1';
            let params = [nombre];

            if (excludeId) {
                query += ' AND id_sede != $2';
                params.push(excludeId);
            }

            const result = await db.query(query, params);
            return parseInt(result.rows[0].count) > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Sede;