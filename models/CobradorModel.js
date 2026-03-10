const db = require('../config/mysql');

class Cobrador {
    static async crear(cobradorData) {
        const { nombre, apellidos, celular, direccion, cedula, id_sede } = cobradorData;
        // Por defecto activo = 1 al crear
        const query = 'INSERT INTO cobradores (nombre, apellidos, celular, direccion, cedula, id_sede, activo) VALUES (?, ?, ?, ?, ?, ?, 1)';
        const values = [nombre, apellidos, celular, direccion, cedula, id_sede];

        try {
            const [result] = await db.query(query, values);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async obtenerTodos(id_sede, includeInactive = false) {
        let query = 'SELECT * FROM cobradores WHERE id_sede = ?';
        if (!includeInactive) {
            query += ' AND activo = 1';
        }
        query += ' ORDER BY id_cobrador DESC';

        const [rows] = await db.query(query, [id_sede]);
        return rows;
    }

    static async obtenerPorId(id, id_sede, includeInactive = false) {
        let query = 'SELECT * FROM cobradores WHERE id_cobrador = ? AND id_sede = ?';
        if (!includeInactive) {
            query += ' AND activo = 1';
        }
        const [rows] = await db.query(query, [id, id_sede]);
        return rows[0];
    }

    static async actualizar(id, cobradorData) {
        const { nombre, apellidos, celular, direccion, cedula } = cobradorData;
        // Nota: No permitimos cambiar el id_sede
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

    static async reactivar(id, id_sede) {
        // Para reactivar un cobrador si es necesario
        const query = 'UPDATE cobradores SET activo = 1 WHERE id_cobrador = ? AND id_sede = ?';
        const [result] = await db.query(query, [id, id_sede]);
        return result.affectedRows > 0;
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
            WHERE cob.id_sede = ?
        `;

        if (!includeInactive) {
            query += ' AND cob.activo = 1';
        }

        query += ' GROUP BY cob.id_cobrador ORDER BY cob.id_cobrador DESC';

        const [rows] = await db.query(query, [id_sede]);
        return rows;
    }

    static async buscarPorCedula(cedula, id_sede, includeInactive = false) {
        let query = 'SELECT * FROM cobradores WHERE cedula = ? AND id_sede = ?';
        if (!includeInactive) {
            query += ' AND activo = 1';
        }
        const [rows] = await db.query(query, [cedula, id_sede]);
        return rows[0];
    }

    // Método adicional: Obtener cobradores con clientes activos
    static async obtenerConClientesActivos(id_sede) {
        const query = `
            SELECT DISTINCT cob.*, 
                COUNT(DISTINCT c.id_cliente) as total_clientes_activos
            FROM cobradores cob
            INNER JOIN clientes c ON cob.id_cobrador = c.id_cobrador AND c.activo = 1
            WHERE cob.id_sede = ? AND cob.activo = 1
            GROUP BY cob.id_cobrador
            ORDER BY cob.nombre ASC
        `;
        const [rows] = await db.query(query, [id_sede]);
        return rows;
    }

    // Método adicional: Buscar cobradores por nombre (para autocomplete)
    static async buscarPorNombre(termino, id_sede) {
        const query = `
            SELECT id_cobrador, nombre, apellidos, cedula, celular
            FROM cobradores 
            WHERE id_sede = ? AND activo = 1 
            AND (nombre LIKE ? OR apellidos LIKE ? OR cedula LIKE ?)
            ORDER BY nombre ASC
            LIMIT 10
        `;
        const searchTerm = `%${termino}%`;
        const [rows] = await db.query(query, [id_sede, searchTerm, searchTerm, searchTerm]);
        return rows;
    }
}

module.exports = Cobrador;