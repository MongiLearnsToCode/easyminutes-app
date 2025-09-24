import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    type: "postgres",
    url: process.env.DATABASE_URL!,
  },
  baseURL: process.env.BETTER_AUTH_URL || "https://easyminutes-app.vercel.app",
  emailAndPassword: {
    enabled: true,
  },
});