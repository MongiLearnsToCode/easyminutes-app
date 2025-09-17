import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "auth.db");
console.log("Database path:", dbPath);

const db = new Database(dbPath);
console.log("Database created successfully");

export const auth = betterAuth({
  database: db,
  baseURL: process.env.BETTER_AUTH_URL || "https://easyminutes-app.vercel.app",
  emailAndPassword: {
    enabled: true,
  },
});

console.log("Better Auth initialized successfully");