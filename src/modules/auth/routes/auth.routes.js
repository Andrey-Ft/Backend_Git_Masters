import express from "express";
const router = express.Router();
import { 
  githubCallback, 
  getProfile, 
  loginWithGitHub, 
  logout 
} from "../controller/auth.controller.js";
import requireAuth from "../../../shared/middlewares/auth.middleware.js";

// Ruta para iniciar la autenticación con GitHub
router.get("/github", loginWithGitHub);

// Callback de GitHub después de autenticarse
// La lógica de fallo y éxito ahora es manejada completamente por el controlador 'githubCallback'
router.get(
  "/github/callback",
  githubCallback
);

// Ruta para ver el perfil del usuario autenticado
router.get("/me", requireAuth, getProfile);

// Ruta para cerrar sesión
router.get("/logout", logout);

// Ruta si falló el login
router.get("/failure", (req, res) => {
  res.send("Fallo la autenticación");
});

export default router;