import "dotenv/config";
import express from "express";
import passport from "passport";
import cookieParser from "cookie-parser";
import cors from "cors";
import "./config/passport.js"; // Carga la estrategia de GitHub

// Rutas de módulos
import authRoutes from "./modules/auth/routes/auth.routes.js";

const app = express();

// CORS configurado para permitir cookies del frontend
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use(authRoutes); // puedes usar un prefix como '/api' si quieres

export default app;