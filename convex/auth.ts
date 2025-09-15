
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const signUp = mutation({
    args: {
        email: v.string(),
        password: v.string(),
        fullName: v.optional(v.string()),
    },
    handler: async (ctx, { email, password, fullName }) => {
        const existingUser = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('email'), email))
            .first();

        if (existingUser) {
            throw new Error('User already exists');
        }

        await ctx.db.insert('users', {
            email,
            password,
            fullName,
        });
    },
});

export const logIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    // This is a placeholder for a real authentication implementation.
    // In a real app, you would use an authentication provider like Clerk, Auth0, or your own.
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), email))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // This is not a secure way to check passwords.
    // In a real app, you would use a secure password hashing library like bcrypt.
    if (user.password !== password) {
      throw new Error('Incorrect password');
    }

    return user;
  },
});

export const logOut = mutation({
  handler: async (ctx) => {
    // This is a placeholder for a real authentication implementation.
    // In a real app, you would clear the user's session.
    return;
  },
});
