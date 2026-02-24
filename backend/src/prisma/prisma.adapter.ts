import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { Pool } from 'pg';

export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const prismaAdapter = new PrismaPg(pgPool);
