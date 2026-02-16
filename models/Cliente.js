const db = require('../config/database');

class Cliente {
    static async crear(clienteData) {
        const { cedula, nombre, apellidos, direccion, celular, id_cobrador } = clienteData;
        const query = 'INSERT INTO clientes (cedula, nombre, apellidos, direccion, celular, id_cobrador) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_cliente';
        const values = [cedula, nombre, apellidos, direccion, celular, id_cobrador];

        try {
            const result = await db.query(query, values);
            return result.rows[0].id_cliente;
        } catch (error) {
            throw error;
        }
    }

    static async obtenerPorCobrador(id_cobrador) {
        const query = `
            SELECT c.*, cob.nombre as cobrador_nombre, cob.apellidos as cobrador_apellidos 
            FROM clientes c 
            INNER JOIN cobradores cob ON c.id_cobrador = cob.id_cobrador 
            WHERE c.id_cobrador = $1
        `;
        const result = await db.query(query, [id_cobrador]);
        return result.rows;
    }

    static async obtenerPorId(id) {
        const query = 'SELECT * FROM clientes WHERE id_cliente = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = Cliente;