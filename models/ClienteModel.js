const db = require('../config/mysql');

class Cliente {

    // Crear cliente
    static async crear(clienteData) {

        const { cedula, nombre, apellidos, direccion, celular, id_cobrador, id_sede } = clienteData;

        const query = `
            INSERT INTO clientes 
            (cedula, nombre, apellidos, direccion, celular, id_cobrador, id_sede, activo)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `;

        const values = [
            cedula,
            nombre,
            apellidos,
            direccion,
            celular,
            id_cobrador,
            id_sede
        ];

        try {

            const [result] = await db.query(query, values);
            return result.insertId;

        } catch (error) {
            throw error;
        }
    }


    // Obtener todos los clientes por sede
    static async obtenerTodos(id_sede) {

        const query = `
            SELECT 
                c.*,
                cob.nombre as cobrador_nombre,
                cob.apellidos as cobrador_apellidos
            FROM clientes c
            LEFT JOIN cobradores cob ON c.id_cobrador = cob.id_cobrador
            WHERE c.id_sede = ?
            ORDER BY c.id_cliente DESC
        `;

        const [rows] = await db.query(query, [id_sede]);

        return rows;
    }


    // Obtener cliente por ID (validando sede)
    static async obtenerPorId(id, id_sede) {

        const query = `
            SELECT 
                c.*,
                cob.nombre as cobrador_nombre,
                cob.apellidos as cobrador_apellidos
            FROM clientes c
            LEFT JOIN cobradores cob ON c.id_cobrador = cob.id_cobrador
            WHERE c.id_cliente = ?
            AND c.id_sede = ?
        `;

        const [rows] = await db.query(query, [id, id_sede]);

        return rows[0];
    }


    // Obtener clientes por cobrador y sede
    static async obtenerPorCobrador(id_cobrador, id_sede) {

        const query = `
            SELECT 
                c.*,
                cob.nombre as cobrador_nombre,
                cob.apellidos as cobrador_apellidos
            FROM clientes c
            INNER JOIN cobradores cob ON c.id_cobrador = cob.id_cobrador
            WHERE c.id_cobrador = ?
            AND c.id_sede = ?
            ORDER BY c.id_cliente DESC
        `;

        const [rows] = await db.query(query, [id_cobrador, id_sede]);

        return rows;
    }


    // Actualizar cliente (validando sede)
    static async actualizar(id, clienteData, id_sede) {

        const { cedula, nombre, apellidos, direccion, celular, id_cobrador } = clienteData;

        const query = `
            UPDATE clientes 
            SET cedula = ?, nombre = ?, apellidos = ?, direccion = ?, celular = ?, id_cobrador = ?
            WHERE id_cliente = ?
            AND id_sede = ?
        `;

        const values = [
            cedula,
            nombre,
            apellidos,
            direccion,
            celular,
            id_cobrador,
            id,
            id_sede
        ];

        const [result] = await db.query(query, values);

        return result.affectedRows > 0;
    }


    // Eliminar cliente (validando sede)
    static async eliminar(id, id_sede) {

        const query = `
            DELETE FROM clientes
            WHERE id_cliente = ?
            AND id_sede = ?
        `;

        const [result] = await db.query(query, [id, id_sede]);

        return result.affectedRows > 0;
    }

}

module.exports = Cliente;