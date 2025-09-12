Git Masters - Backend de Gamificación
Este es el backend para Git Masters, una plataforma de gamificación interna diseñada para fomentar la adopción de mejores prácticas de desarrollo dentro de la empresa. El sistema se integra directamente con los webhooks de GitHub para analizar la actividad de los repositorios en tiempo real, recompensando a los desarrolladores con puntos e insignias por seguir las convenciones y estándares establecidos.

Características Principales
Integración con GitHub Webhooks: Procesa eventos como push, pull_request, create, release, etc., en tiempo real.

Motor de Reglas Complejo: Lógica de negocio detallada para asignar puntos basados en condiciones específicas (mensajes de commit, nombres de ramas, calidad de PRs).

Sistema de Puntos y Logros: Asigna puntos por acciones positivas y penalizaciones por prácticas riesgosas. La base para un futuro sistema de insignias está implementada.

Autenticación Segura: Login de usuarios a través de GitHub (OAuth 2.0) usando Passport.js.

Arquitectura Modular y Escalable: El código está organizado en módulos y sigue un patrón de capas (Rutas, Controlador, Servicio) para un fácil mantenimiento.

Base de Datos Robusta: Usa Prisma y PostgreSQL para una gestión de datos transaccional y segura.

Pila Tecnológica (Tech Stack)
Backend: Node.js, Express.js

Base de Datos: PostgreSQL

ORM: Prisma

Autenticación: Passport.js (Estrategia de GitHub), JSON Web Tokens (JWT)

Contenerización: Docker

Pruebas: Jest

Cómo Empezar
Sigue estos pasos para levantar el entorno de desarrollo local.

Prerrequisitos
Node.js (v18 o superior)

npm (o tu gestor de paquetes preferido)

Una instancia de PostgreSQL corriendo localmente o en Docker.

Una cuenta de GitHub y una App de OAuth para obtener credenciales.

1. Instalación
Bash

# 1. Clona el repositorio
git clone (https://github.com/Andrey-Ft/Backend_Git_Masters.git)

# 2. Navega a la carpeta del backend
cd backend

# 3. Instala las dependencias
npm install
2. Configuración del Entorno
Crea un archivo .env en la raíz de la carpeta backend y usa el siguiente contenido como plantilla.

Fragmento de código

# URL de conexión a tu base de datos PostgreSQL
# Formato: postgresql://USUARIO:PASSWORD@HOST:PUERTO/NOMBRE_DB
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/gitmasters_dev"

# Clave secreta para firmar los JSON Web Tokens (JWT)
JWT_SECRET="UNA_CLAVE_SECRETA_MUY_LARGA_Y_SEGURA"

# Secreto para verificar los webhooks de GitHub (muy importante)
GITHUB_WEBHOOK_SECRET="OTRA_CLAVE_SECRETA_PARA_WEBHOOKS"

# Credenciales de tu App de OAuth de GitHub
GITHUB_CLIENT_ID="TU_CLIENT_ID_DE_GITHUB"
GITHUB_CLIENT_SECRET="TU_CLIENT_SECRET_DE_GITHUB"

# URL del frontend para redirecciones y CORS
FRONTEND_URL="http://localhost:5173"
3. Configuración de la Base de Datos
Con tu archivo .env configurado, Prisma se encargará de la configuración. Este comando creará la base de datos (si no existe) y aplicará todas las migraciones.

Bash

npx prisma migrate dev --name init
4. Iniciar la Aplicación
Bash

# Iniciar el servidor en modo de desarrollo (con recarga automática)
npm run dev
El servidor debería estar corriendo en http://localhost:3000.

Pruebas (Testing)
Para ejecutar la suite de pruebas automatizadas, utiliza el siguiente comando:

Bash

npm test

Despliegue (Deployment)
La aplicación está diseñada para ser contenerizada con Docker y desplegada en servicios de hosting modernos como Vercel o Railway.

Estructura del Proyecto
El backend utiliza una arquitectura modular para mantener el código organizado y desacoplado. Cada módulo es responsable de una entidad o característica de negocio y sigue una estructura interna de capas (controlador, servicio, rutas, etc.).

backend/
├── prisma/               # Configuración del esquema de la base de datos
├── src/                  # Código fuente de la aplicación
│   ├── modules/
│   │   ├── auth/         # Autenticación y gestión de sesiones
│   │   ├── badges-events/# Gestión de insignias
│   │   ├── dashboard/    # Endpoints para el panel de control
│   │   ├── events/       # Gestión de eventos
│   │   ├── profile/      # Perfil de usuario
│   │   ├── rules-points/ # Motor de reglas de gamificación
│   │   ├── user/         # Gestión de datos de usuario
│   │   └── webhooks/     # Receptor de webhooks de GitHub
│   ├── shared/         # Código compartido (middlewares, utils)
│   └── config/         # Configuraciones globales (ej. Prisma Client)
├── tests/                # Pruebas automatizadas por módulo
├── .env                  # Variables de entorno (local)
├── Dockerfile            # Instrucciones para construir la imagen de Docker
├── package.json          # Dependencias y scripts del proyecto
└── server.js             # Punto de entrada principal del servidor
└── README.md

## Proyectos Relacionados
Git Masters - Frontend: Repositorio del frontend, desarrollado con React y Vite (https://github.com/Andrey-Ft/Frontend_Git_Masters).

Licencia
Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.


## Licencia

Este repositorio se distribuye bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## Autor

- [Andrey-Ft](https://github.com/Andrey-Ft)

---