const db = require('../config/database');

class Credito {
    static async crear(creditoData) {
        const { fecha_credito, fecha_pago, monto_prestado, monto_por_pagar, id_cliente, id_cobrador, estado } = creditoData;
        const [result] = await db.execute(
            'INSERT INTO creditos (fecha_credito, fecha_pago, monto_prestado, monto_por_pagar, id_cliente, id_cobrador, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [fecha_credito, fecha_pago, monto_prestado, monto_por_pagar, id_cliente, id_cobrador, estado || 'pendiente']
        );
        return result.insertId;
    }

    static async obtenerPorCliente(id_cliente) {
        const [rows] = await db.execute(
            'SELECT cr.*, cl.nombre as cliente_nombre, cl.apellidos as cliente_apellidos, cob.nombre as cobrador_nombre, cob.apellidos as cobrador_apellido FROM creditos cr INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente INNER JOIN cobradores cob ON cr.id_cobrador = cob.id_cobrador WHERE cr.id_cliente = ?',
            [id_cliente]
        );
        return rows;
    }

    static async obtenerPorCobrador(id_cobrador) {
        const [rows] = await db.execute(
            'SELECT cr.*, cl.nombre as cliente_nombre, cl.apellidos as cliente_apellidos FROM creditos cr INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente WHERE cr.id_cobrador = ?',
            [id_cobrador]
        );
        return rows;
    }
}

module.exports = Credito;