import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Next dev hot-reloads modules; without the global cache each reload leaks a pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // Prisma 7 connects through a driver adapter rather than a bundled engine.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
