// backend/server.js

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import cron from 'node-cron';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/docs/swagger.js'; // Importación directa del spec
import './src/config/passport.js';
 
// --- IMPORTACIÓN DE RUTAS Y MIDDLEWARES ---
import authRoutes from './src/modules/auth/routes/auth.routes.js';
import webhookRoutes from './src/modules/webhooks/routes/webhook.routes.js';
import pointRoutes from './src/modules/rules-points/routes/point.routes.js';
import eventsRoutes from './src/modules/events/routes/events.routes.js';
import profileRoutes from './src/modules/profile/routes/profile.routes.js';
import leaderboardRoutes from './src/modules/leaderboard/routes/leaderboard.routes.js';
import teamsRoutes from './src/modules/teams/routes/teams.routes.js';
import dashboardRoutes from './src/modules/dashboard/routes/dashboard.routes.js';
import badgesRoutes from './src/modules/badges/routes/badges.routes.js';

import requestLogger from './src/shared/middlewares/requestLogger.js';
import { evaluateDailyBadges, evaluateMonthlyBadges } from './src/modules/badges/service/badges.service.js';
 
const app = express();
const PORT = process.env.PORT || 3000;
 
// --- MIDDLEWARES GLOBALES ---
app.use(requestLogger);
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Passport y sesión (Nota: Passport v0.7+ ya no requiere 'express-session')
app.use(session({
  secret: process.env.SESSION_SECRET || 'un_secreto_muy_fuerte',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());
 
// --- RUTAS DE LA APLICACIÓN ---
app.get('/', (req, res) => {
  res.send('API de Git Masters funcionando! 🚀');
});

// Ruta de documentación de la API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas de Webhooks (usa un parser de cuerpo crudo para la verificación de la firma)
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Prefijo /api para todas las demás rutas de la aplicación
const apiRouter = express.Router();
apiRouter.use(express.json()); // El parser de JSON aplica a todas las rutas de /api

apiRouter.use('/auth', authRoutes);
apiRouter.use('/points', pointRoutes);
apiRouter.use('/events', eventsRoutes);
apiRouter.use('/profile', profileRoutes);
apiRouter.use('/leaderboard', leaderboardRoutes);
apiRouter.use('/teams', teamsRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/badges', badgesRoutes);

app.use('/api', apiRouter); // Monta todas las rutas de la API bajo /api

// Ruta de fallback para login fallido
app.get('/login-failed', (req, res) => {
  res.status(401).send('Fallo la autenticación.');
});
 
// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentación de la API disponible en http://localhost:${PORT}/api-docs`);
 
  // --- TAREAS PROGRAMADAS (CRON JOBS) ---
  // Se ejecutan en la zona horaria del servidor (configurada como America/Bogota)
  const cronOptions = { timezone: "America/Bogota" };

  // Tarea para insignias DIARIAS (todos los días a las 3:00 AM)
  cron.schedule('0 3 * * *', () => {
    console.log(`[${new Date().toISOString()}] Ejecutando tarea de insignias diarias...`);
    evaluateDailyBadges();
  }, cronOptions);
 
  // Tarea para insignias MENSUALES (el día 1 de cada mes a las 4:00 AM)
  cron.schedule('0 4 1 * *', () => {
    console.log(`[${new Date().toISOString()}] Ejecutando tarea de insignias mensuales...`);
    evaluateMonthlyBadges();
  }, cronOptions);
 
  console.log('Tareas de evaluación de insignias programadas.');
});