import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  minutes: defineTable({
    userId: v.string(),
    title: v.string(),
    summary: v.string(),
    attendees: v.array(v.string()),
    keyPoints: v.array(v.string()),
    decisions: v.array(v.string()),
    actionItems: v.array(v.object({ task: v.string(), owner: v.string() })),
  }),
  user_subscriptions: defineTable({
    userId: v.string(),
    polar_customer_id: v.optional(v.string()),
    polar_subscription_id: v.optional(v.string()),
    polar_order_id: v.optional(v.string()),
    plan_type: v.optional(v.string()),
    status: v.optional(v.string()),
    current_period_start: v.optional(v.number()),
    current_period_end: v.optional(v.number()),
    meetings_used: v.optional(v.number()),
    meetings_limit: v.optional(v.number()),
  }).index('by_userId', ['userId']),
});