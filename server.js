import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import './src/config/passport.js';
import cron from 'node-cron'; // 1. Importamos node-cron

// --- IMPORTACIÓN DE RUTAS Y MIDDLEWARES ---
import authRoutes from './src/modules/auth/routes/auth.routes.js';
import webhookRoutes from './src/modules/webhooks/routes/webhook.routes.js';
import eventsRoutes from './src/modules/events/routes/events.routes.js';
import profileRoutes from './src/modules/profile/routes/profile.routes.js';
import leaderboardRoutes from './src/modules/leaderboard/routes/leaderboard.routes.js';
import teamsRoutes from './src/modules/teams/routes/teams.routes.js';
import dashboardRoutes from './src/modules/dashboard/routes/dashboard.routes.js';
import requestLogger from './src/shared/middlewares/requestLogger.js';
// 2. Importamos los servicios de evaluación de insignias
import { evaluateDailyBadges, evaluateMonthlyBadges } from './src/modules/badges/service/badges.service.js';

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
app.use('/profile', profileRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/teams', teamsRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/login-failed', (req, res) => {
  res.status(401).send('Fallo la autenticación.');
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);

  // 3. Programamos las tareas de evaluación de insignias
  
  // Tarea para insignias DIARIAS (todos los días a las 3:00 AM)
  cron.schedule('0 3 * * *', () => {
    console.log('Ejecutando la tarea programada de insignias diarias...');
    evaluateDailyBadges();
  }, {
    timezone: "America/Bogota" // Ajusta a tu zona horaria
  });

  // Tarea para insignias MENSUALES (el día 1 de cada mes a las 4:00 AM)
  cron.schedule('0 4 1 * *', () => {
    console.log('Ejecutando la tarea programada de insignias mensuales...');
    evaluateMonthlyBadges();
  }, {
    timezone: "America/Bogota" // Ajusta a tu zona horaria
  });

  console.log('Tareas de evaluación de insignias programadas (diarias y mensuales).');
});
