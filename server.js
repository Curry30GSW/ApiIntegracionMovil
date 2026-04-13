const express = require('express');
const cors = require('cors');
require('dotenv').config();

const cobradorRoutes = require('./routes/cobradorRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const creditoRoutes = require('./routes/creditoRoutes');
const authRoutes = require('./routes/usuarioRoutes');
const sedeRoutes = require('./routes/sedeRoutes');
const telegramBotController = require('./controllers/telegramBotController');

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
   credentials: true,
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

app.use('/api', authRoutes);
app.use('/api/cobradores', cobradorRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/creditos', creditoRoutes);
app.use('/api/sedes', sedeRoutes);

// Webhook de Telegram
app.post('/telegram-webhook', telegramBotController.handleWebhook);
app.get('/telegram-test', telegramBotController.testBot);

/* =========================
   RUTA TEST
========================= */

app.get('/', (req, res) => {
   res.json({ message: 'API de Cobradores funcionando con JWT' });
});

/* =========================
   INICIALIZAR WEBHOOK DE TELEGRAM
========================= */

// Solo configurar webhook en producción (Vercel)
if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
   console.log('🤖 Configurando webhook de Telegram...');
   telegramBotController.setWebhook().then(() => {
      console.log('✅ Webhook configurado');
   }).catch(err => {
      console.error('❌ Error configurando webhook:', err);
   });
}

/* =========================
   ERROR 404
========================= */

app.use((req, res) => {
   res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;