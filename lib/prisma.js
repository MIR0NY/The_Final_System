// lib/prisma.js
import { PrismaClient } from '@prisma/client';

// Declare a global variable for PrismaClient (for Next.js hot-reloading in development)
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use the global object to prevent multiple instances
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;