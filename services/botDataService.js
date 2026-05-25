const db = require('../config/database');

async function buscarClientePorNombre(nombre, id_sede) {
    const query = `
        SELECT
            id_cliente,
            cedula,
            nombre,
            apellidos,
            direccion,
            celular,
            activo
        FROM clientes
        WHERE id_sede = $1
          AND (
            LOWER(nombre) LIKE LOWER($2)
            OR LOWER(apellidos) LIKE LOWER($2)
            OR LOWER(CONCAT(nombre, ' ', apellidos)) LIKE LOWER($2)
          )
        ORDER BY nombre, apellidos
        LIMIT 10
    `;

    const result = await db.query(query, [id_sede, `%${nombre}%`]);
    return result.rows;
}

async function consultarDeudaPorNombre(nombre, id_sede) {
    const query = `
        SELECT
            c.id_cliente,
            c.nombre,
            c.apellidos,
            COALESCE(SUM(cr.monto_por_pagar), 0) AS deuda_total,
            COUNT(*) FILTER (WHERE cr.estado <> 'pagado') AS creditos_pendientes
        FROM clientes c
        LEFT JOIN creditos cr
            ON cr.id_cliente = c.id_cliente
           AND cr.id_sede = c.id_sede
        WHERE c.id_sede = $1
          AND (
            LOWER(c.nombre) LIKE LOWER($2)
            OR LOWER(c.apellidos) LIKE LOWER($2)
            OR LOWER(CONCAT(c.nombre, ' ', c.apellidos)) LIKE LOWER($2)
          )
        GROUP BY c.id_cliente, c.nombre, c.apellidos
    `;

    const result = await db.query(query, [id_sede, `%${nombre}%`]);
    return result.rows;
}

async function consultarClientesPendientes(id_sede) {
    const query = `
        SELECT
            c.id_cliente,
            c.nombre,
            c.apellidos,
            c.celular,
            cr.id_credito,
            cr.estado,
            cr.fecha_pago,
            cr.monto_por_pagar
        FROM clientes c
        JOIN creditos cr
            ON cr.id_cliente = c.id_cliente
        WHERE c.id_sede = $1
          AND cr.estado <> 'pagado'
        ORDER BY cr.fecha_pago ASC
    `;

    const result = await db.query(query, [id_sede]);
    return result.rows;
}

module.exports = {
    buscarClientePorNombre,
    consultarDeudaPorNombre,
    consultarClientesPendientes
};
