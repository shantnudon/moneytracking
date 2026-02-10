import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'node --env-file=../.env prisma/seed.js',
  },
});