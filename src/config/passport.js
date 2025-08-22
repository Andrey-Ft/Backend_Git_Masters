// RUTA: src/config/passport.js

import passport from "passport";
import GitHubStrategy from "passport-github2";
import prisma from './prisma.js'; // ✅ PASO 1: Importamos el cliente de Prisma

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/github/callback`,
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        let userEmail = null;

        // --- (Tu lógica para obtener el email se mantiene intacta) ---
        if (profile.emails && profile.emails.length > 0) {
          userEmail = profile.emails[0].value;
        }
        if (!userEmail) {
          const response = await fetch('https://api.github.com/user/emails', {
            headers: {
              'Authorization': `token ${accessToken}`,
              'User-Agent': 'your-app-name'
            }
          });
          if (!response.ok) throw new Error("No se pudo obtener el email del perfil de GitHub.");
          const emails = await response.json();
          const primaryEmail = emails.find(email => email.primary === true);
          userEmail = primaryEmail ? primaryEmail.email : (emails[0]?.email || null);
        }
        if (!userEmail) {
          return done(new Error("No se encontró un email asociado al perfil de GitHub."));
        }
        
        // --- ✅ INICIA LÓGICA DE BASE DE DATOS ---

        // Usamos 'upsert' de Prisma: "update or insert" (actualizar o insertar)
        const dbUser = await prisma.user.upsert({
          // 1. Dónde buscar al usuario: por su ID único de GitHub
          where: {
            githubId: parseInt(profile.id), // El ID de GitHub es el identificador único
          },
          // 2. Qué datos actualizar si el usuario ya existe
          update: {
            username: profile.username,
            email: userEmail,
            avatarUrl: profile.photos?.[0]?.value || null,
          },
          // 3. Qué datos usar para crear el usuario si no existe
          create: {
            githubId: parseInt(profile.id), // IMPORTANTE: El ID de GitHub es un string, lo convertimos a Int
            username: profile.username,
            email: userEmail,
            avatarUrl: profile.photos?.[0]?.value || null,
          },
        });
        
        // --- ✅ TERMINA LÓGICA DE BASE DE DATOS ---

        // Pasamos el usuario DE NUESTRA BASE DE DATOS a la siguiente fase
        return done(null, dbUser);

      } catch (error) {
        console.error("Error en la estrategia de GitHub:", error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  // Serializamos usando el ID de nuestra base de datos
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  // Deserializamos buscando el usuario por su ID en nuestra DB
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});