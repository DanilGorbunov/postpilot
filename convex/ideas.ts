import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getIdeas = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ideas")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createIdea = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ideas", {
      userId: args.userId,
      content: args.content,
      source: args.source,
      used: false,
    });
  },
});

export const markIdeaUsed = mutation({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ideaId, { used: true });
  },
});
