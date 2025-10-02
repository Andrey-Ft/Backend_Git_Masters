// jest.config.cjs
module.exports = {
  // Define el entorno de prueba como Node.js.
  testEnvironment: 'node',

  // Le dice a Jest que use "babel-jest" para transformar
  // todos los archivos .js y .mjs antes de ejecutarlos.
  transform: {
    '^.+\\.(js|mjs)$': 'babel-jest',
  },
  
  // Clave para proyectos ESM: evita que Babel ignore los módulos
  // que podrían necesitar ser transformados.
  transformIgnorePatterns: [],
};