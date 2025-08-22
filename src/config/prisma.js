// RUTA: src/config/prisma.js

import { PrismaClient } from '@prisma/client';

// Previene múltiples instancias de PrismaClient en desarrollo
const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;