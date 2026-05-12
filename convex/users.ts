import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    picture: v.optional(v.string()),
    googleSub: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        picture: args.picture,
        googleSub: args.googleSub,
      });
      return { userId: existing._id, isNew: false };
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      picture: args.picture,
      googleSub: args.googleSub,
    });
    return { userId, isNew: true };
  },
});

export const getUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const upsertPrefs = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    role: v.optional(v.string()),
    location: v.optional(v.string()),
    bio: v.optional(v.string()),
    projects: v.optional(v.string()),
    stack: v.optional(v.string()),
    audience: v.optional(v.string()),
    tone: v.optional(v.string()),
    avoid: v.optional(v.string()),
    lang: v.optional(v.string()),
    apikey: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    litoken: v.optional(v.string()),
    site: v.optional(v.string()),
    length: v.optional(v.string()),
    githubToken: v.optional(v.string()),
    contentPillars: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;

    const existing = await ctx.db
      .query("prefs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }

    return await ctx.db.insert("prefs", { userId, ...fields });
  },
});

export const getPrefs = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("prefs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});
