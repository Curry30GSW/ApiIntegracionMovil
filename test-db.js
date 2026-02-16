const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Conexión exitosa:', res.rows[0]);
    } catch (err) {
        console.error('❌ Error de conexión:', err.message);
    } finally {
        await pool.end();
    }
}

testConnection();