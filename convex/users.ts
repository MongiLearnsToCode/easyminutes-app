
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const getCurrentUser = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const user = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('email'), identity.email!))
            .first();

        return user;
    },
});

export const getCurrentUserIdentity = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        return identity;
    },
});

export const getUserProfile = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const user = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('email'), identity.email!))
            .first();

        return user;
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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const existingUser = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('email'), identity.email!))
            .first();

        if (!existingUser) {
            throw new Error("User not found");
        }

        await ctx.db.patch(existingUser._id, args);
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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Check if user already exists
        const existingUser = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('email'), identity.email!))
            .first();

        if (existingUser) {
            return existingUser;
        }

        const userId = await ctx.db.insert('users', {
            ...args,
            email: identity.email!, // Use the email from auth identity
        });

        return await ctx.db.get(userId);
    },
});
