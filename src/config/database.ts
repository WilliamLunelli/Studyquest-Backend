import { PrismaClient } from "../generated/prisma/client";

interface GlobalPrisma {
  prisma?: PrismaClient;
}

const globalForPrisma = globalThis as unknown as GlobalPrisma;

const isDev = process.env.NODE_ENV !== "production";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (isDev) globalForPrisma.prisma = prisma;

export default prisma;
