import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.LOG_QUERIES === 'true' ? ['query'] : ['warn', 'error'],
});

export default prisma;
