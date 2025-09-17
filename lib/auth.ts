import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    // Add providers here as needed
    // Example: GoogleProvider, GitHubProvider, etc.
  ],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}