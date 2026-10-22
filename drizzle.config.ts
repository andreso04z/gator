import { defineConfig } from "drizzle-kit";
import { readConfig } from "./src/config";

const DB_URL = readConfig().dbUrl;

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/out",
  dialect: "postgresql",
  dbCredentials: {
    url: DB_URL,
  },
});
