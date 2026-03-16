const db = require('../config/database');
const bcrypt = require('bcrypt');

class Usuario {
    // Buscar usuario por nombre de usuario
    static async findByUsername(usuario) {
        try {
            const result = await db.query(
                `SELECT u.*, s.nombre_sede 
                 FROM usuarios u
                 LEFT JOIN sedes s ON u.id_sede = s.id_sede
                 WHERE u.usuario = $1 AND u.activo = $2`,
                [usuario, true]
            );

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async comparePassword(contraseñaIngresada, contraseñaAlmacenada) {
        return await bcrypt.compare(contraseñaIngresada, contraseñaAlmacenada);
    }

    static async getAll() {
        try {
            const result = await db.query(
                `SELECT u.*, s.nombre_sede, s.created_at
                 FROM usuarios u
                 LEFT JOIN sedes s ON u.id_sede = s.id_sede
                 ORDER BY u.id_usuario DESC`
            );
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    static async getById(id) {
        try {
            const result = await db.query(
                `SELECT id_usuario, usuario, nombre, rol, id_sede
                 FROM usuarios 
                 WHERE id_usuario = $1`,
                [id]
            );

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Crear nuevo usuario (para registro)
    static async create(usuarioData) {
        try {
            const { usuario, contraseña, nombre, rol, id_sede } = usuarioData;

            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contraseña, salt);

            const result = await db.query(
                'INSERT INTO usuarios (usuario, contraseña, nombre, rol, id_sede, activo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_usuario',
                [usuario, hashedPassword, nombre, rol, id_sede, true]
            );

            return result.rows[0].id_usuario;
        } catch (error) {
            throw error;
        }
    }

    // Actualizar usuario
    static async update(id, usuarioData) {
        try {
            const { usuario, contraseña, nombre, rol, id_sede } = usuarioData;

            let query, values;

            if (contraseña) {
                // Si hay nueva contraseña
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(contraseña, salt);

                query = `UPDATE usuarios 
                        SET usuario = $1, contraseña = $2, nombre = $3, rol = $4, id_sede = $5 
                        WHERE id_usuario = $6
                        RETURNING id_usuario`;
                values = [usuario, hashedPassword, nombre, rol, id_sede, id];
            } else {
                // Sin cambiar contraseña
                query = `UPDATE usuarios 
                        SET usuario = $1, nombre = $2, rol = $3, id_sede = $4 
                        WHERE id_usuario = $5
                        RETURNING id_usuario`;
                values = [usuario, nombre, rol, id_sede, id];
            }

            const result = await db.query(query, values);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar (desactivar) usuario
    static async delete(id) {
        try {
            const result = await db.query(
                'UPDATE usuarios SET activo = $1 WHERE id_usuario = $2 AND activo = $3 RETURNING id_usuario',
                [false, id, true]
            );
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    // Reactivar usuario
    static async activate(id) {
        try {
            const result = await db.query(
                'UPDATE usuarios SET activo = $1 WHERE id_usuario = $2 AND activo = $3 RETURNING id_usuario',
                [true, id, false]
            );
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Usuario;