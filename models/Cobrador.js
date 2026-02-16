const db = require('../config/database');

class Cobrador {
    static async crear(cobradorData) {
        const { nombre, apellidos, celular, direccion, cedula } = cobradorData;
        const query = 'INSERT INTO cobradores (nombre, apellidos, celular, direccion, cedula) VALUES ($1, $2, $3, $4, $5) RETURNING id_cobrador';
        const values = [nombre, apellidos, celular, direccion, cedula];

        try {
            const result = await db.query(query, values);
            return result.rows[0].id_cobrador;
        } catch (error) {
            throw error;
        }
    }

    static async obtenerTodos() {
        const query = 'SELECT * FROM cobradores ORDER BY id_cobrador DESC';
        try {
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    static async obtenerPorId(id) {
        const query = 'SELECT * FROM cobradores WHERE id_cobrador = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = Cobrador;