import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPosts = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("deleted"),
        v.literal("scheduled"),
        v.literal("published")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.status !== undefined) {
      return await ctx.db
        .query("posts")
        .withIndex("by_userId_status", (q) =>
          q.eq("userId", args.userId).eq("status", args.status!)
        )
        .collect();
    }
    return await ctx.db
      .query("posts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createPost = mutation({
  args: {
    userId: v.id("users"),
    tone: v.string(),
    angle: v.string(),
    content: v.string(),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("deleted"),
        v.literal("scheduled"),
        v.literal("published")
      )
    ),
    pillar: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", {
      userId: args.userId,
      tone: args.tone,
      angle: args.angle,
      content: args.content,
      status: args.status ?? "active",
      pillar: args.pillar,
      source: args.source,
    });
  },
});

export const createManyPosts = mutation({
  args: {
    userId: v.id("users"),
    posts: v.array(
      v.object({
        tone: v.string(),
        angle: v.string(),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids: string[] = [];
    for (const post of args.posts) {
      const id = await ctx.db.insert("posts", {
        userId: args.userId,
        tone: post.tone,
        angle: post.angle,
        content: post.content,
        status: "active",
      });
      ids.push(id);
    }
    return ids;
  },
});

export const updatePost = mutation({
  args: {
    postId: v.id("posts"),
    tone: v.optional(v.string()),
    angle: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("deleted"),
        v.literal("scheduled"),
        v.literal("published")
      )
    ),
    scheduledDate: v.optional(v.string()),
    pillar: v.optional(v.string()),
    source: v.optional(v.string()),
    score: v.optional(v.number()),
    scoreDetails: v.optional(
      v.object({
        hook: v.number(),
        clarity: v.number(),
        cta: v.number(),
        feedback: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { postId, ...fields } = args;
    // Remove undefined keys so we don't overwrite existing values with undefined
    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(postId, patch);
  },
});

export const setStatus = mutation({
  args: {
    postId: v.id("posts"),
    status: v.union(
      v.literal("active"),
      v.literal("deleted"),
      v.literal("scheduled"),
      v.literal("published")
    ),
    scheduledDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      status: args.status,
      scheduledDate: args.scheduledDate,
    });
  },
});

export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, { status: "deleted" });
  },
});

export const restorePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, { status: "active" });
  },
});
