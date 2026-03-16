const express = require('express');
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
      'https://gotagota-frontend.vercel.app',
      'https://gotagota-frontend-hs80dajn5-andres-currys-projects.vercel.app',
      'https://gotagota-frontend-iwcvhenf4-andres-currys-projects.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
   ],
   credentials: true, // Aunque con JWT ya no es estrictamente necesario, lo dejamos por si acaso
   optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

/* =========================
   BODY PARSER
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   RUTAS API
========================= */

// IMPORTANTE: authRoutes NO debe tener el middleware de verificación de token
// porque el login es público
app.use('/api', authRoutes);

// Estas rutas SI estarán protegidas por el middleware JWT (dentro de cada archivo de rutas)
app.use('/api/cobradores', cobradorRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/creditos', creditoRoutes);
app.use('/api/sedes', sedeRoutes);

/* =========================
   RUTA TEST
========================= */

app.get('/', (req, res) => {
   res.json({ message: 'API de Cobradores funcionando con JWT' });
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