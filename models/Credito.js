const db = require('../config/database');

class Credito {
    static async crear(creditoData) {
        const { fecha_credito, fecha_pago, monto_prestado, monto_por_pagar, id_cliente, id_cobrador, estado } = creditoData;
        const query = `
            INSERT INTO creditos (fecha_credito, fecha_pago, monto_prestado, monto_por_pagar, id_cliente, id_cobrador, estado) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id_credito
        `;
        const values = [fecha_credito, fecha_pago, monto_prestado, monto_por_pagar, id_cliente, id_cobrador, estado || 'pendiente'];

        try {
            const result = await db.query(query, values);
            return result.rows[0].id_credito;
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
            WHERE cr.id_cliente = $1
        `;
        const result = await db.query(query, [id_cliente]);
        return result.rows;
    }

    static async obtenerPorCobrador(id_cobrador) {
        const query = `
            SELECT cr.*, cl.nombre as cliente_nombre, cl.apellidos as cliente_apellidos 
            FROM creditos cr 
            INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente 
            WHERE cr.id_cobrador = $1
        `;
        const result = await db.query(query, [id_cobrador]);
        return result.rows;
    }
}

module.exports = Credito;