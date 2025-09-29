import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import './src/config/passport.js';

// --- IMPORTACIÓN DE RUTAS Y MIDDLEWARES ---
import authRoutes from './src/modules/auth/routes/auth.routes.js';
import webhookRoutes from './src/modules/webhooks/routes/webhook.routes.js';
import eventsRoutes from './src/modules/events/routes/events.routes.js';
import profileRoutes from './src/modules/profile/routes/profile.routes.js'; // <-- AÑADIDO
import requestLogger from './src/shared/middlewares/requestLogger.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARES GLOBALES ---
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'un_secreto_muy_fuerte',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax' 
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// --- RUTAS DE LA APLICACIÓN ---
app.get('/', (req, res) => {
  res.send('Servidor funcionando con Passport y GitHub Auth! 🚀');
});

app.use('/auth', authRoutes);
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Para el resto de las rutas que usan JSON
app.use(express.json()); // Middleware de JSON global para las rutas de abajo
app.use('/events', eventsRoutes);
app.use('/profile', profileRoutes); // 

app.get('/login-failed', (req, res) => {
  res.status(401).send('Fallo la autenticación.');
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});