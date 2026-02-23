const db = require('../config/mysql');

class Cobrador {
    static async crear(cobradorData) {
        const { nombre, apellidos, celular, direccion, cedula } = cobradorData;
        // Por defecto activo = 1 al crear
        const query = 'INSERT INTO cobradores (nombre, apellidos, celular, direccion, cedula, activo) VALUES (?, ?, ?, ?, ?, 1)';
        const values = [nombre, apellidos, celular, direccion, cedula];

        try {
            const [result] = await db.query(query, values);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async obtenerTodos(includeInactive = false) {
        let query = 'SELECT * FROM cobradores';
        query += ' ORDER BY id_cobrador DESC';

        const [rows] = await db.query(query);
        return rows;
    }

    static async obtenerPorId(id, includeInactive = false) {
        let query = 'SELECT * FROM cobradores WHERE id_cobrador = ?';
        if (!includeInactive) {
            query += ' AND activo = 1';
        }
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }

    static async actualizar(id, cobradorData) {
        const { nombre, apellidos, celular, direccion, cedula } = cobradorData;
        const query = 'UPDATE cobradores SET nombre = ?, apellidos = ?, celular = ?, direccion = ?, cedula = ? WHERE id_cobrador = ? AND activo = 1';
        const values = [nombre, apellidos, celular, direccion, cedula, id];

        const [result] = await db.query(query, values);
        return result.affectedRows > 0;
    }

    static async eliminar(id) {
        // Borrado lógico: cambiar activo a 0
        const query = 'UPDATE cobradores SET activo = 0 WHERE id_cobrador = ? AND activo = 1';
        const [result] = await db.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async reactivar(id) {
        // Para reactivar un cobrador si es necesario
        const query = 'UPDATE cobradores SET activo = 1 WHERE id_cobrador = ?';
        const [result] = await db.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async obtenerConEstadisticas(includeInactive = false) {
        let query = `
            SELECT 
                cob.*,
                COUNT(DISTINCT c.id_cliente) as total_clientes,
                COUNT(DISTINCT cr.id_credito) as total_creditos,
                SUM(CASE WHEN cr.estado = 'pendiente' THEN 1 ELSE 0 END) as creditos_pendientes,
                SUM(cr.monto_por_pagar) as monto_total_gestionado
            FROM cobradores cob
            LEFT JOIN clientes c ON cob.id_cobrador = c.id_cobrador
            LEFT JOIN creditos cr ON c.id_cliente = cr.id_cliente
        `;

        if (!includeInactive) {
            query += ' WHERE cob.activo = 1';
        }

        query += ' GROUP BY cob.id_cobrador ORDER BY cob.id_cobrador DESC';

        const [rows] = await db.query(query);
        return rows;
    }

    static async buscarPorCedula(cedula, includeInactive = false) {
        let query = 'SELECT * FROM cobradores WHERE cedula = ?';
        if (!includeInactive) {
            query += ' AND activo = 1';
        }
        const [rows] = await db.query(query, [cedula]);
        return rows[0];
    }
}

module.exports = Cobrador;