const db = require('../config/mysql');

class Credito {
    static async crear(creditoData) {
        const { fecha_credito, fecha_pago, monto_prestado, monto_por_pagar, id_cliente, id_cobrador, estado, id_sede } = creditoData;
        const query = `
            INSERT INTO creditos (fecha_credito, fecha_pago, monto_prestado, monto_por_pagar, id_cliente, id_cobrador, estado, id_sede) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [fecha_credito, fecha_pago, monto_prestado, monto_por_pagar, id_cliente, id_cobrador, estado || 'pendiente', id_sede];

        try {
            const [result] = await db.query(query, values);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async obtenerPorCliente(id_cliente, id_sede) {
        const query = `
            SELECT cr.*, 
                   cl.nombre as cliente_nombre, 
                   cl.apellidos as cliente_apellidos,
                   cl.cedula as cliente_cedula,
                   cl.celular as cliente_celular,
                   cl.direccion as cliente_direccion,
                   cob.nombre as cobrador_nombre,
                   cob.apellidos as cobrador_apellidos,
                   cob.cedula as cobrador_cedula,
                   cob.celular as cobrador_celular
            FROM creditos cr 
            INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente 
            INNER JOIN cobradores cob ON cr.id_cobrador = cob.id_cobrador 
            WHERE cr.id_cliente = ? AND cr.id_sede = ?
            ORDER BY cr.fecha_credito DESC
        `;
        const [rows] = await db.query(query, [id_cliente, id_sede]);
        return rows;
    }

    static async obtenerPorCobrador(id_cobrador, id_sede) {
        const query = `
            SELECT cr.*, 
                   cl.nombre as cliente_nombre, 
                   cl.apellidos as cliente_apellidos,
                   cl.cedula as cliente_cedula,
                   cl.celular as cliente_celular,
                   cl.direccion as cliente_direccion
            FROM creditos cr 
            INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente 
            WHERE cr.id_cobrador = ? AND cr.id_sede = ?
            ORDER BY cr.fecha_credito DESC
        `;
        const [rows] = await db.query(query, [id_cobrador, id_sede]);
        return rows;
    }

    static async obtenerTodos(id_sede) {
        const query = `
            SELECT cr.*, 
                   cl.nombre as cliente_nombre, 
                   cl.apellidos as cliente_apellidos, 
                   cl.cedula as cliente_cedula,
                   cl.celular as cliente_celular,
                   cl.direccion as cliente_direccion,
                   cob.nombre as cobrador_nombre, 
                   cob.apellidos as cobrador_apellidos,
                   cob.cedula as cobrador_cedula,
                   cob.celular as cobrador_celular
            FROM creditos cr 
            INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente 
            INNER JOIN cobradores cob ON cr.id_cobrador = cob.id_cobrador 
            WHERE cr.id_sede = ?
            ORDER BY cr.fecha_credito DESC
        `;
        const [rows] = await db.query(query, [id_sede]);
        return rows;
    }

    static async actualizarEstado(id_credito, estado) {
        const query = 'UPDATE creditos SET estado = ? WHERE id_credito = ?';
        await db.query(query, [estado, id_credito]);
        return true;
    }

    static async obtenerPorId(id, id_sede) {
        const query = 'SELECT * FROM creditos WHERE id_credito = ? AND id_sede = ?';
        const [rows] = await db.query(query, [id, id_sede]);
        return rows[0];
    }

    static async obtenerPorCobradorConDetalles(id_cobrador, id_sede) {
        const query = `
            SELECT 
                cr.*,
                cl.nombre as cliente_nombre,
                cl.apellidos as cliente_apellidos,
                cl.cedula as cliente_cedula,
                cl.celular as cliente_celular,
                cl.direccion as cliente_direccion,
                cob.nombre as cobrador_nombre,
                cob.apellidos as cobrador_apellidos,
                cob.cedula as cobrador_cedula,
                cob.celular as cobrador_celular,
                DATEDIFF(CURDATE(), cr.fecha_pago) as dias_vencidos
            FROM creditos cr
            INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente
            INNER JOIN cobradores cob ON cr.id_cobrador = cob.id_cobrador
            WHERE cr.id_cobrador = ? AND cr.id_sede = ?
            ORDER BY 
                CASE cr.estado
                    WHEN 'vencido' THEN 1
                    WHEN 'pendiente' THEN 2
                    WHEN 'pagado' THEN 3
                END,
                cr.fecha_credito DESC
        `;
        const [rows] = await db.query(query, [id_cobrador, id_sede]);
        return rows;
    }

    static async obtenerEstadisticasPorCobrador(id_cobrador, id_sede) {
        const query = `
            SELECT 
                COUNT(DISTINCT cr.id_credito) as total_creditos,
                COUNT(DISTINCT cl.id_cliente) as total_clientes,
                SUM(CASE WHEN cr.estado = 'pendiente' THEN 1 ELSE 0 END) as creditos_pendientes,
                SUM(CASE WHEN cr.estado = 'pagado' THEN 1 ELSE 0 END) as creditos_pagados,
                SUM(CASE WHEN cr.estado = 'vencido' THEN 1 ELSE 0 END) as creditos_vencidos,
                COALESCE(SUM(cr.monto_prestado), 0) as total_prestado,
                COALESCE(SUM(CASE WHEN cr.estado != 'pagado' THEN cr.monto_por_pagar ELSE 0 END), 0) as total_por_cobrar,
                COALESCE(SUM(CASE WHEN cr.estado = 'pagado' THEN cr.monto_por_pagar ELSE 0 END), 0) as total_cobrado,
                COALESCE(SUM(CASE WHEN cr.estado = 'pendiente' THEN cr.monto_por_pagar ELSE 0 END), 0) as monto_pendiente,
                COALESCE(SUM(CASE WHEN cr.estado = 'vencido' THEN cr.monto_por_pagar ELSE 0 END), 0) as monto_vencido,
                MAX(cr.fecha_credito) as ultimo_credito,
                MIN(cr.fecha_credito) as primer_credito
            FROM creditos cr
            INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente
            WHERE cr.id_cobrador = ? AND cr.id_sede = ?
        `;
        const [rows] = await db.query(query, [id_cobrador, id_sede]);
        return rows[0];
    }

    // Método adicional: Obtener créditos por estado
    static async obtenerPorEstado(estado, id_sede) {
        const query = `
            SELECT cr.*, 
                   cl.nombre as cliente_nombre, 
                   cl.apellidos as cliente_apellidos,
                   cl.cedula as cliente_cedula,
                   cl.celular as cliente_celular,
                   cob.nombre as cobrador_nombre,
                   cob.apellidos as cobrador_apellidos
            FROM creditos cr
            INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente
            INNER JOIN cobradores cob ON cr.id_cobrador = cob.id_cobrador
            WHERE cr.estado = ? AND cr.id_sede = ?
            ORDER BY 
                CASE 
                    WHEN ? = 'vencido' THEN cr.fecha_pago
                    ELSE cr.fecha_credito
                END DESC
        `;
        const [rows] = await db.query(query, [estado, id_sede, estado]);
        return rows;
    }

    // Método adicional: Obtener créditos vencidos
    static async obtenerVencidos(id_sede) {
        const query = `
            SELECT cr.*, 
                   cl.nombre as cliente_nombre, 
                   cl.apellidos as cliente_apellidos,
                   cl.cedula as cliente_cedula,
                   cl.celular as cliente_celular,
                   cl.direccion as cliente_direccion,
                   cob.nombre as cobrador_nombre,
                   cob.apellidos as cobrador_apellidos,
                   cob.celular as cobrador_celular,
                   DATEDIFF(CURDATE(), cr.fecha_pago) as dias_vencidos
            FROM creditos cr
            INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente
            INNER JOIN cobradores cob ON cr.id_cobrador = cob.id_cobrador
            WHERE cr.estado = 'pendiente' 
              AND cr.fecha_pago < CURDATE() 
              AND cr.id_sede = ?
            ORDER BY cr.fecha_pago ASC
        `;
        const [rows] = await db.query(query, [id_sede]);
        return rows;
    }

    // Método adicional: Obtener resumen de créditos por sede
    static async obtenerResumen(id_sede) {
        const query = `
            SELECT 
                COUNT(*) as total_creditos,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as creditos_pendientes,
                SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END) as creditos_pagados,
                SUM(CASE WHEN estado = 'vencido' THEN 1 ELSE 0 END) as creditos_vencidos,
                COALESCE(SUM(monto_prestado), 0) as monto_total_prestado,
                COALESCE(SUM(CASE WHEN estado != 'pagado' THEN monto_por_pagar ELSE 0 END), 0) as monto_total_por_cobrar,
                COALESCE(SUM(CASE WHEN estado = 'pagado' THEN monto_por_pagar ELSE 0 END), 0) as monto_total_cobrado,
                COUNT(DISTINCT id_cliente) as total_clientes_con_credito,
                COUNT(DISTINCT id_cobrador) as total_cobradores_activos
            FROM creditos
            WHERE id_sede = ?
        `;
        const [rows] = await db.query(query, [id_sede]);
        return rows[0];
    }

    // Método adicional: Obtener créditos por rango de fechas
    static async obtenerPorRangoFechas(fecha_inicio, fecha_fin, id_sede) {
        const query = `
            SELECT cr.*, 
                   cl.nombre as cliente_nombre, 
                   cl.apellidos as cliente_apellidos,
                   cl.cedula as cliente_cedula,
                   cob.nombre as cobrador_nombre,
                   cob.apellidos as cobrador_apellidos
            FROM creditos cr
            INNER JOIN clientes cl ON cr.id_cliente = cl.id_cliente
            INNER JOIN cobradores cob ON cr.id_cobrador = cob.id_cobrador
            WHERE cr.fecha_credito BETWEEN ? AND ? 
              AND cr.id_sede = ?
            ORDER BY cr.fecha_credito DESC
        `;
        const [rows] = await db.query(query, [fecha_inicio, fecha_fin, id_sede]);
        return rows;
    }
}

module.exports = Credito;