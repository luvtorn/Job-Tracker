import { PrismaClient } from "@prisma/client";
import { createDatabaseAdapter } from "@/lib/database-adapter";
import { env } from "@/server/config/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  try {
    return new PrismaClient({
      adapter: createDatabaseAdapter(env.databaseUrl),
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error(`Failed to create PrismaClient [${name}]`);
    throw error;
  }
};

export const prisma =
  globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
