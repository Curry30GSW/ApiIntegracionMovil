const db = require('../config/mysql');
const bcrypt = require('bcrypt');

class Usuario {
    // Buscar usuario por nombre de usuario
    static async findByUsername(usuario) {
        try {
            const [rows] = await db.query(
                `SELECT u.*, s.nombre_sede 
                        FROM usuarios u
                        LEFT JOIN sedes s ON u.id_sede = s.id_sede
                        WHERE u.usuario = ? AND u.activo = 1`,
                [usuario]
            );

            return rows[0];

        } catch (error) {
            throw error;
        }
    }

    static async comparePassword(contraseñaIngresada, contraseñaAlmacenada) {
        return await bcrypt.compare(contraseñaIngresada, contraseñaAlmacenada);
    }

    static async getAll() {
        try {
            const [rows] = await db.query(
                `SELECT u.*, s.nombre_sede, s.created_at
                 FROM usuarios u
                 LEFT JOIN sedes s ON u.id_sede = s.id_sede
                 ORDER BY u.id_usuario DESC`
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }


    static async getById(id) {
        try {
            const [rows] = await db.query(
                `SELECT id_usuario, usuario, nombre, rol, id_sede
                 FROM usuarios 
                 WHERE id_usuario = ?`,
                [id]
            );

            return rows[0];

        } catch (error) {
            throw error;
        }
    }

    // Crear nuevo usuario (para registro)
    static async create(usuarioData) {
        try {
            const { usuario, contraseña, nombre, rol, id_sede } = usuarioData; // ← Asegurar que id_sede está incluido

            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contraseña, salt);

            // ✅ Incluir id_sede en la consulta
            const [result] = await db.query(
                'INSERT INTO usuarios (usuario, contraseña, nombre, rol, id_sede, activo) VALUES (?, ?, ?, ?, ?, ?)',
                [usuario, hashedPassword, nombre, rol, id_sede, true] // ← Agregar id_sede aquí
            );

            return result.insertId;
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
                query = `UPDATE usuarios 
                        SET usuario = ?, contraseña = ?, nombre = ?, rol = ?, id_sede = ? 
                        WHERE id_usuario = ?`;
                values = [usuario, contraseña, nombre, rol, id_sede, id];
            } else {
                // Sin cambiar contraseña
                query = `UPDATE usuarios 
                        SET usuario = ?, nombre = ?, rol = ?, id_sede = ? 
                        WHERE id_usuario = ?`;
                values = [usuario, nombre, rol, id_sede, id];
            }

            const [result] = await db.query(query, values);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar (desactivar) usuario
    static async delete(id) {
        try {
            const [result] = await db.query(
                'UPDATE usuarios SET activo = 0 WHERE id_usuario = ? AND activo = 1',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Reactivar usuario
    static async activate(id) {
        try {
            const [result] = await db.query(
                'UPDATE usuarios SET activo = 1 WHERE id_usuario = ? AND activo = 0',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

}

module.exports = Usuario;