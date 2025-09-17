import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : (process.env.BETTER_AUTH_URL || "https://easyminutes-app.vercel.app"),
  fetchOptions: {
    onRequest: (context) => {
      console.log('Auth request URL:', context.url);
      console.log('Auth request method:', context.method);
    },
    onResponse: (context) => {
      console.log('Auth response status:', context.response?.status);
    },
    onError: (context) => {
      console.error('Auth error:', context.error);
    },
  },
});