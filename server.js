const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const cobradorRoutes = require('./routes/cobradorRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const creditoRoutes = require('./routes/creditoRoutes');
const authRoutes = require('./routes/usuarioRoutes');
const sedeRoutes = require('./routes/sedeRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   CORS (ANTES DE LAS RUTAS)
========================= */

app.use(cors({
    origin: 'http://localhost:5173', // React (Vite)
    credentials: true
}));

/* =========================
   BODY PARSER
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   SESSION
========================= */

app.use(session({
    secret: process.env.SESSION_SECRET || "secreto123",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true solo si usas https
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 // 24 horas
    }
}));

/* =========================
   RUTAS API
========================= */

app.use('/api/cobradores', cobradorRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/creditos', creditoRoutes);
app.use('/api', authRoutes);
app.use('/api/sedes', sedeRoutes);
/* =========================
   RUTA TEST
========================= */

app.get('/', (req, res) => {
    res.json({ message: 'API de Cobradores funcionando' });
});

/* =========================
   ERROR 404
========================= */

app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;