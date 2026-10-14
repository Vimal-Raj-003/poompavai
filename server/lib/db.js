import { PrismaClient } from '@prisma/client';

const g = globalThis;
export const db = g.__pp_db || (g.__pp_db = new PrismaClient());
