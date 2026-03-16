const db = require('../config/database');

class Cliente {
    // Crear cliente
    static async crear(clienteData) {
        const { cedula, nombre, apellidos, direccion, celular, id_cobrador, id_sede } = clienteData;

        const query = `
            INSERT INTO clientes 
            (cedula, nombre, apellidos, direccion, celular, id_cobrador, id_sede, activo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id_cliente
        `;

        const values = [
            cedula,
            nombre,
            apellidos,
            direccion,
            celular,
            id_cobrador || null, // Manejar null si no hay cobrador
            id_sede,
            1 // activo
        ];

        try {
            const result = await db.query(query, values);
            return result.rows[0].id_cliente;
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
            WHERE c.id_sede = $1
            ORDER BY c.id_cliente DESC
        `;

        const result = await db.query(query, [id_sede]);
        return result.rows;
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
            WHERE c.id_cliente = $1
            AND c.id_sede = $2
        `;

        const result = await db.query(query, [id, id_sede]);
        return result.rows[0];
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
            WHERE c.id_cobrador = $1
            AND c.id_sede = $2
            ORDER BY c.id_cliente DESC
        `;

        const result = await db.query(query, [id_cobrador, id_sede]);
        return result.rows;
    }

    // Actualizar cliente (validando sede)
    static async actualizar(id, clienteData, id_sede) {
        const { cedula, nombre, apellidos, direccion, celular, id_cobrador } = clienteData;

        const query = `
            UPDATE clientes 
            SET cedula = $1, nombre = $2, apellidos = $3, direccion = $4, celular = $5, id_cobrador = $6
            WHERE id_cliente = $7
            AND id_sede = $8
            RETURNING id_cliente
        `;

        const values = [
            cedula,
            nombre,
            apellidos,
            direccion,
            celular,
            id_cobrador || null,
            id,
            id_sede
        ];

        const result = await db.query(query, values);
        return result.rowCount > 0;
    }

    // Eliminar cliente (validando sede)
    static async eliminar(id, id_sede) {
        const query = `
            DELETE FROM clientes
            WHERE id_cliente = $1
            AND id_sede = $2
            RETURNING id_cliente
        `;

        const result = await db.query(query, [id, id_sede]);
        return result.rowCount > 0;
    }
}

module.exports = Cliente;