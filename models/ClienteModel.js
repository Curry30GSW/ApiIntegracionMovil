const db = require('../config/mysql');

class Cliente {
    static async crear(clienteData) {
        const { cedula, nombre, apellidos, direccion, celular, id_cobrador } = clienteData;
        const query = 'INSERT INTO clientes (cedula, nombre, apellidos, direccion, celular, id_cobrador, activo) VALUES (?, ?, ?, ?, ?, ?, 1)';
        const values = [cedula, nombre, apellidos, direccion, celular, id_cobrador];

        try {
            const [result] = await db.query(query, values);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async obtenerTodos() {
        const query = `
            SELECT c.*, cob.nombre as cobrador_nombre, cob.apellidos as cobrador_apellidos 
            FROM clientes c 
            LEFT JOIN cobradores cob ON c.id_cobrador = cob.id_cobrador 
            ORDER BY c.id_cliente DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    static async obtenerPorId(id) {
        const query = `
            SELECT c.*, cob.nombre as cobrador_nombre, cob.apellidos as cobrador_apellidos 
            FROM clientes c 
            LEFT JOIN cobradores cob ON c.id_cobrador = cob.id_cobrador 
            WHERE c.id_cliente = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }

    static async obtenerPorCobrador(id_cobrador) {
        const query = `
            SELECT c.*, cob.nombre as cobrador_nombre, cob.apellidos as cobrador_apellidos 
            FROM clientes c 
            INNER JOIN cobradores cob ON c.id_cobrador = cob.id_cobrador 
            WHERE c.id_cobrador = ?
            ORDER BY c.id_cliente DESC
        `;
        const [rows] = await db.query(query, [id_cobrador]);
        return rows;
    }

    static async actualizar(id, clienteData) {
        const { cedula, nombre, apellidos, direccion, celular, id_cobrador } = clienteData;
        const query = 'UPDATE clientes SET cedula = ?, nombre = ?, apellidos = ?, direccion = ?, celular = ?, id_cobrador = ? WHERE id_cliente = ?';
        const values = [cedula, nombre, apellidos, direccion, celular, id_cobrador, id];

        await db.query(query, values);
        return true;
    }

    static async eliminar(id) {
        const query = 'DELETE FROM clientes WHERE id_cliente = ?';
        await db.query(query, [id]);
        return true;
    }
}

module.exports = Cliente;