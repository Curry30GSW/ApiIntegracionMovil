const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const cobradorRoutes = require('./routes/cobradorRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const creditoRoutes = require('./routes/creditoRoutes');
const authRoutes = require('./routes/usuarioRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api/cobradores', cobradorRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/creditos', creditoRoutes);
app.use('/api', authRoutes);

// Configuración de CORS para React
app.use(cors({
    origin: 'http://localhost:5173', // o el puerto donde corre tu React
    credentials: true, // Permitir cookies/autenticación
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuración de sesión
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true en producción con HTTPS
        maxAge: 1000 * 60 * 60 * 24, // 24 horas
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Rutas
app.use('/api', authRoutes); // Prefijo /api para las rutas

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: 'API de Cobradores funcionando' });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}