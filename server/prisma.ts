import { PrismaClient } from '../generated/prisma';

// Create a singleton PrismaClient instance
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, we want to reuse the same instance across hot reloads
  // This prevents having too many connections open during development
  if (!(global as any).__prisma) {
    (global as any).__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = (global as any).__prisma;
}

export { prisma };

// Helper function to handle Prisma errors gracefully
export async function prismaHandler<T>(
  callback: () => Promise<T>,
  errorMessage = 'Database operation failed'
): Promise<[T | null, Error | null]> {
  try {
    const result = await callback();
    return [result, null];
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}