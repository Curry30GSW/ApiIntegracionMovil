const db = require('../config/database');

class Cobrador {
    static async crear(cobradorData) {
        const { nombre, apellidos, celular, direccion, cedula, id_sede } = cobradorData;

        const query = `
            INSERT INTO cobradores (nombre, apellidos, celular, direccion, cedula, id_sede, activo) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id_cobrador
        `;
        const values = [nombre, apellidos, celular, direccion, cedula, id_sede, 1];

        try {
            const result = await db.query(query, values);
            return result.rows[0].id_cobrador;
        } catch (error) {
            throw error;
        }
    }

    static async obtenerTodos(id_sede, includeInactive = false) {
        let query = 'SELECT * FROM cobradores WHERE id_sede = $1';
        const values = [id_sede];

        if (!includeInactive) {
            query += ' AND activo = 1';
        }
        query += ' ORDER BY id_cobrador DESC';

        const result = await db.query(query, values);
        return result.rows;
    }

    static async obtenerPorId(id, id_sede, includeInactive = false) {
        let query = 'SELECT * FROM cobradores WHERE id_cobrador = $1 AND id_sede = $2';
        const values = [id, id_sede];

        if (!includeInactive) {
            query += ' AND activo = 1';
        }

        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async actualizar(id, cobradorData) {
        const { nombre, apellidos, celular, direccion, cedula } = cobradorData;

        const query = `
            UPDATE cobradores 
            SET nombre = $1, apellidos = $2, celular = $3, direccion = $4, cedula = $5 
            WHERE id_cobrador = $6 AND activo = 1
            RETURNING id_cobrador
        `;
        const values = [nombre, apellidos, celular, direccion, cedula, id];

        const result = await db.query(query, values);
        return result.rowCount > 0;
    }

    static async eliminar(id) {
        const query = `
            UPDATE cobradores 
            SET activo = 0 
            WHERE id_cobrador = $1 AND activo = 1
            RETURNING id_cobrador
        `;
        const result = await db.query(query, [id]);
        return result.rowCount > 0;
    }

    static async reactivar(id, id_sede) {
        const query = `
            UPDATE cobradores 
            SET activo = 1 
            WHERE id_cobrador = $1 AND id_sede = $2
            RETURNING id_cobrador
        `;
        const result = await db.query(query, [id, id_sede]);
        return result.rowCount > 0;
    }

    static async obtenerConEstadisticas(id_sede, includeInactive = false) {
        let query = `
            SELECT 
                cob.*,
                COUNT(DISTINCT c.id_cliente) as total_clientes,
                COUNT(DISTINCT cr.id_credito) as total_creditos,
                SUM(CASE WHEN cr.estado = 'pendiente' THEN 1 ELSE 0 END) as creditos_pendientes,
                COALESCE(SUM(cr.monto_por_pagar), 0) as monto_total_gestionado,
                COALESCE(SUM(CASE WHEN cr.estado = 'pendiente' THEN cr.monto_por_pagar ELSE 0 END), 0) as monto_pendiente,
                COALESCE(SUM(CASE WHEN cr.estado = 'pagado' THEN cr.monto_por_pagar ELSE 0 END), 0) as monto_cobrado
            FROM cobradores cob
            LEFT JOIN clientes c ON cob.id_cobrador = c.id_cobrador
            LEFT JOIN creditos cr ON c.id_cliente = cr.id_cliente
            WHERE cob.id_sede = $1
        `;

        const values = [id_sede];

        if (!includeInactive) {
            query += ' AND cob.activo = 1';
        }

        query += ' GROUP BY cob.id_cobrador ORDER BY cob.id_cobrador DESC';

        const result = await db.query(query, values);
        return result.rows;
    }

    static async buscarPorCedula(cedula, id_sede, includeInactive = false) {
        let query = 'SELECT * FROM cobradores WHERE cedula = $1 AND id_sede = $2';
        const values = [cedula, id_sede];

        if (!includeInactive) {
            query += ' AND activo = 1';
        }

        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async obtenerConClientesActivos(id_sede) {
        const query = `
            SELECT DISTINCT cob.*, 
                COUNT(DISTINCT c.id_cliente) as total_clientes_activos
            FROM cobradores cob
            INNER JOIN clientes c ON cob.id_cobrador = c.id_cobrador AND c.activo = 1
            WHERE cob.id_sede = $1 AND cob.activo = 1
            GROUP BY cob.id_cobrador
            ORDER BY cob.nombre ASC
        `;
        const result = await db.query(query, [id_sede]);
        return result.rows;
    }

    static async buscarPorNombre(termino, id_sede) {
        const query = `
            SELECT id_cobrador, nombre, apellidos, cedula, celular
            FROM cobradores 
            WHERE id_sede = $1 AND activo = 1 
            AND (nombre ILIKE $2 OR apellidos ILIKE $2 OR cedula ILIKE $2)
            ORDER BY nombre ASC
            LIMIT 10
        `;
        const searchTerm = `%${termino}%`;
        const result = await db.query(query, [id_sede, searchTerm, searchTerm, searchTerm]);
        return result.rows;
    }
}

module.exports = Cobrador;