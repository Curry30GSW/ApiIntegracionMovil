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

const corsOptions = {
   origin: [
      'https://gotagota-frontend.vercel.app',           // ← Producción (principal)
      'https://gotagota-frontend-hs80dajn5-andres-currys-projects.vercel.app', // ← Preview actual
      'https://gotagota-frontend-iwcvhenf4-andres-currys-projects.vercel.app', // ← Preview anterior
      'http://localhost:5173',                           // ← Desarrollo local
      'http://localhost:3000'                             // ← Desarrollo local alternativo
   ],
   credentials: true
};

app.use(cors(corsOptions));


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
   resave: true,
   saveUninitialized: true,
   cookie: {
      secure: true, // Siempre true en Vercel (HTTPS)
      httpOnly: true,
      sameSite: 'none', // Necesario para cross-site
      maxAge: 1000 * 60 * 60 * 24,
      domain: '.vercel.app'
   },
   proxy: true // Necesario para Vercel
}));

// PON ESTO ANTES DE TUS RUTAS
app.use((req, res, next) => {
   console.log('==================');
   console.log('📌 SOLICITUD:', req.method, req.url);
   console.log('🍪 Cookies recibidas:', req.headers.cookie);
   console.log('🆔 Session ID:', req.sessionID);
   console.log('👤 Usuario en sesión:', req.session.user);
   console.log('==================');
   next();
});

/* =========================
   RUTAS API
========================= */
app.use('/api', authRoutes);
app.use('/api/cobradores', cobradorRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/creditos', creditoRoutes);
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