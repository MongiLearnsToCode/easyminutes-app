import { betterAuth } from "better-auth";
import { convexAdapter } from "@convex-dev/better-auth";

// Initialize the Convex adapter
// Note: You'll need to configure your Convex client
// For now, we'll use a basic setup that you can customize
export const auth = betterAuth({
  database: convexAdapter(),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    // You can add social providers here as needed
    // google: {
    //   clientId: process.env.GOOGLE_CLIENT_ID || "",
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    // },
    // github: {
    //   clientId: process.env.GITHUB_CLIENT_ID || "",
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    // },
  },
  // Add other configuration options as needed
});