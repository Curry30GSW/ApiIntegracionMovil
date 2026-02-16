const db = require('../config/database');

class Cobrador {
    static async crear(cobradorData) {
        const { nombre, apellidos, celular, direccion, cedula } = cobradorData;
        const [result] = await db.execute(
            'INSERT INTO cobradores (nombre, apellidos, celular, direccion, cedula) VALUES (?, ?, ?, ?, ?)',
            [nombre, apellidos, celular, direccion, cedula]
        );
        return result.insertId;
    }

    static async obtenerTodos() {
        const [rows] = await db.execute('SELECT * FROM cobradores');
        return rows;
    }

    static async obtenerPorId(id) {
        const [rows] = await db.execute('SELECT * FROM cobradores WHERE id_cobrador = ?', [id]);
        return rows[0];
    }
}

module.exports = Cobrador;