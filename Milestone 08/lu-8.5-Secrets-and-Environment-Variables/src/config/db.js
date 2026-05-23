// src/config/db.js
// Prisma client — DATABASE_URL is read from the environment (see prisma/schema.prisma)

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
