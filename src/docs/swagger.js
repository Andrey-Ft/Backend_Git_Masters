import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Git Masters",
      version: "1.0.0",
      description: "Documentación de la API con Swagger",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local de desarrollo",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
        },
      },
      responses: {
        UnauthorizedError: {
          description: "No autorizado. El usuario no ha iniciado sesión.",
        },
        InternalServerError: {
          description: "Error interno en el servidor.",
        },
      },
      schemas: {
        DashboardResponse: {
          type: "object",
          properties: {
            resumen: { type: "string" },
            ranking: { type: "integer" },
            insignias: { type: "array", items: { type: "string" } },
            historial: { type: "array", items: { type: "string" } },
            rankingEquipos: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },
  apis: [
    "./src/modules/dashboard/*.docs.js", // 👈 Asegúrate de incluir Dashboard
    "./src/docs/*.js",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
