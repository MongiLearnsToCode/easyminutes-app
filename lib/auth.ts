import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import path from "path";

// Use a more reliable path for the database
const dbPath = path.join(process.cwd(), "auth.db");
const db = new Database(dbPath);

export const auth = betterAuth({
  database: db,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
});