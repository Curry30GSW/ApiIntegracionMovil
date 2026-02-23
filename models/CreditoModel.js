const db = require('../config/mysql');

class Credito {
    static async crear(creditoData) {
        const { fecha_credito, fecha_pago, monto_prestado, monto_por_pagar, id_cliente, id_cobrador, estado } = creditoData;
        const query = `
            INSERT INTO creditos (fecha_credito, fecha_pago, monto_prestado, monto_por_pagar, id_cliente, id_cobrador, estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [fecha_credito, fecha_pago, monto_prestado, monto_por_pagar, id_cliente, id_cobrador, estado || 'pendiente'];

        try {
            const [result] = await db.query(query, values);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async obtenerPorCliente(id_cliente) {
        const query = `
            SELECT cr.*, cl.nombre as cliente_nombre, cl.apellidos as cliente_apellidos, cob.nombre as cobrador_nombre 
            FROM creditos cr 
            INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente 
            INNER JOIN cobradores cob ON cr.id_cobrador = cob.id_cobrador 
            WHERE cr.id_cliente = ?
            ORDER BY cr.fecha_credito DESC
        `;
        const [rows] = await db.query(query, [id_cliente]);
        return rows;
    }

    static async obtenerPorCobrador(id_cobrador) {
        const query = `
            SELECT cr.*, cl.nombre as cliente_nombre, cl.apellidos as cliente_apellidos 
            FROM creditos cr 
            INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente 
            WHERE cr.id_cobrador = ?
            ORDER BY cr.fecha_credito DESC
        `;
        const [rows] = await db.query(query, [id_cobrador]);
        return rows;
    }

    static async obtenerTodos() {
        const query = `
            SELECT cr.*, cl.nombre as cliente_nombre, cl.apellidos as cliente_apellidos, cl.cedula, 
                   cob.nombre as cobrador_nombre, cob.apellidos as cobrador_apellidos
            FROM creditos cr 
            INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente 
            INNER JOIN cobradores cob ON cr.id_cobrador = cob.id_cobrador 
            ORDER BY cr.fecha_credito DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    }

    static async actualizarEstado(id_credito, estado) {
        const query = 'UPDATE creditos SET estado = ? WHERE id_credito = ?';
        await db.query(query, [estado, id_credito]);
        return true;
    }

    static async obtenerPorId(id) {
        const query = 'SELECT * FROM creditos WHERE id_credito = ?';
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }
}

module.exports = Credito;