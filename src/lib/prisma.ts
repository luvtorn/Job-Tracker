import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  try {
    const neon = new PrismaNeon({
      connectionString: process.env.DATABASE_URL,
    });

    return new PrismaClient({
      adapter: neon,
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
    });
  } catch (error) {
    console.error("Failed to create PrismaClient:", error);
    throw error;
  }
};

export const prisma =
  globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
