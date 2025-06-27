import { type Config } from 'drizzle-kit';

export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // process.env.DATABASE_URL が存在することを non-null assertion (!) で型チェッカーに伝えます
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
} satisfies Config;