
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const getCurrentUser = query({
    handler: async (ctx) => {
        const user = await ctx.db
            .query('users')
            .first();

        return user || { name: 'Demo User', email: 'demo@example.com' };
    },
});

export const getCurrentUserIdentity = query({
    handler: async (ctx) => {
        return { subject: 'demo-user', email: 'demo@example.com', name: 'Demo User' };
    },
});

export const getUserProfile = query({
    handler: async (ctx) => {
        const user = await ctx.db
            .query('users')
            .first();

        return user || { name: 'Demo User', email: 'demo@example.com' };
    },
});

export const updateUserProfile = mutation({
    args: {
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query('users')
            .first();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, args);
        } else {
            await ctx.db.insert('users', args);
        }
    },
});

export const createUser = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if user already exists
        const existingUser = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('email'), args.email))
            .first();

        if (existingUser) {
            return existingUser;
        }

        const userId = await ctx.db.insert('users', args);

        return await ctx.db.get(userId);
    },
});
