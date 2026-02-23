const mysql = require('mysql2');
require('dotenv').config();

const mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    port: process.env.MYSQL_PORT || 3306
});

mysqlPool.getConnection((err, connection) => {
    if (err) {
        console.error('Error conectando a MySQL:', err.stack);
    } else {
        console.log('Conectado a MySQL exitosamente');
        connection.release();
    }
});

module.exports = mysqlPool.promise();