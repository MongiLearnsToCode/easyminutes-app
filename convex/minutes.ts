
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const getAllMinutes = query({ 
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        return await ctx.db.query('minutes').collect();
    }
});

export const addMinute = mutation({
  args: {
    title: v.string(),
    summary: v.string(),
    attendees: v.array(v.string()),
    keyPoints: v.array(v.string()),
    decisions: v.array(v.string()),
    actionItems: v.array(v.object({ task: v.string(), owner: v.string() })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Not authenticated");
    }

    const id = await ctx.db.insert('minutes', { ...args, userId: identity.subject });
    const minute = await ctx.db.get(id);
    return { ...minute, id, createdAt: minute!._creationTime };
  },
});

export const updateMinute = mutation({
  args: {
    id: v.id('minutes'),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    attendees: v.optional(v.array(v.string())),
    keyPoints: v.optional(v.array(v.string())),
    decisions: v.optional(v.array(v.string())),
    actionItems: v.optional(v.array(v.object({ task: v.string(), owner: v.string() }))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Not authenticated");
    }

    const { id, ...rest } = args;

    const existingMinute = await ctx.db.get(id);

    if (!existingMinute) {
        throw new Error("Minute not found");
    }

    if (existingMinute.userId !== identity.subject) {
        throw new Error("Not authorized");
    }

    await ctx.db.patch(id, rest);
    const minute = await ctx.db.get(id);
    return { ...minute, id, createdAt: minute!._creationTime };
  },
});

export const deleteMinute = mutation({
  args: { id: v.id('minutes') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Not authenticated");
    }

    const existingMinute = await ctx.db.get(args.id);

    if (!existingMinute) {
        throw new Error("Minute not found");
    }

    if (existingMinute.userId !== identity.subject) {
        throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});
