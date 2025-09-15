
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const PLAN_LIMITS: { [key: string]: any } = {
    free: {
        meetings_limit: 1,
        can_save: false,
        can_export: false,
        can_share: false,
        has_autosave: false,
        has_audio_transcription: false,
        session_generation_limit: 5,
        has_priority_support: false,
        has_custom_templates: false,
        has_api_access: false,
    },
    one_time: {
        meetings_limit: 10,
        can_save: true,
        can_export: true,
        can_share: true,
        has_autosave: true,
        has_audio_transcription: true,
        session_generation_limit: -1,
        has_priority_support: false,
        has_custom_templates: false,
        has_api_access: false,
    },
    starter: {
        meetings_limit: 50,
        can_save: true,
        can_export: true,
        can_share: true,
        has_autosave: true,
        has_audio_transcription: true,
        session_generation_limit: -1,
        has_priority_support: true,
        has_custom_templates: false,
        has_api_access: false,
    },
    pro: {
        meetings_limit: -1,
        can_save: true,
        can_export: true,
        can_share: true,
        has_autosave: true,
        has_audio_transcription: true,
        session_generation_limit: -1,
        has_priority_support: true,
        has_custom_templates: true,
        has_api_access: true,
    },
    enterprise: {
        meetings_limit: -1,
        can_save: true,
        can_export: true,
        can_share: true,
        has_autosave: true,
        has_audio_transcription: true,
        session_generation_limit: -1,
        has_priority_support: true,
        has_custom_templates: true,
        has_api_access: true,
    },
};

export const getSubscription = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const userId = identity.subject;

        const subscription = await ctx.db
            .query("user_subscriptions")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        return subscription;
    },
});

export const getPlanLimits = query({
    args: { planType: v.string() },
    handler: async (ctx, args) => {
        return PLAN_LIMITS[args.planType] || PLAN_LIMITS.free;
    },
});

export const upsertSubscription = mutation({
    args: {
        lemonsqueezy_customer_id: v.optional(v.string()),
        lemonsqueezy_subscription_id: v.optional(v.string()),
        lemonsqueezy_order_id: v.optional(v.string()),
        plan_type: v.optional(v.string()),
        status: v.optional(v.string()),
        current_period_start: v.optional(v.number()),
        current_period_end: v.optional(v.number()),
        meetings_used: v.optional(v.number()),
        meetings_limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const existingSubscription = await ctx.db
            .query("user_subscriptions")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (existingSubscription) {
            await ctx.db.patch(existingSubscription._id, args);
        } else {
            await ctx.db.insert("user_subscriptions", { userId, ...args });
        }
    },
});
