const db = require('../config/database');

class Cliente {
    static async crear(clienteData) {
        const { cedula, nombre, apellidos, direccion, celular, id_cobrador } = clienteData;
        const [result] = await db.execute(
            'INSERT INTO clientes (cedula, nombre, apellidos, direccion, celular, id_cobrador) VALUES (?, ?, ?, ?, ?, ?)',
            [cedula, nombre, apellidos, direccion, celular, id_cobrador]
        );
        return result.insertId;
    }

    static async obtenerPorCobrador(id_cobrador) {
        const [rows] = await db.execute(
            'SELECT c.*, cob.nombre as cobrador_nombre, cob.apellidos as cobrador_apellidos FROM clientes c INNER JOIN cobradores cob ON c.id_cobrador = cob.id_cobrador WHERE c.id_cobrador = ?',
            [id_cobrador]
        );
        return rows;
    }

    static async obtenerPorId(id) {
        const [rows] = await db.execute('SELECT * FROM clientes WHERE id_cliente = ?', [id]);
        return rows[0];
    }
}

module.exports = Cliente;