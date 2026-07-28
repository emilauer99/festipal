import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit uses the DIRECT (unpooled) Neon URL for migrations; the app runtime
 * uses the pooled URL (see src/client.ts and .env.example).
 */
export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '',
  },
});
