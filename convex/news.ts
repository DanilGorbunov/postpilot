import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getNews = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("newsPosts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createNewsPost = mutation({
  args: {
    userId: v.id("users"),
    topic: v.string(),
    headline: v.string(),
    content: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("newsPosts", {
      userId: args.userId,
      topic: args.topic,
      headline: args.headline,
      content: args.content,
      imageUrl: args.imageUrl,
      savedToPost: false,
    });
  },
});

export const saveNewsAsPost = mutation({
  args: {
    newsId: v.id("newsPosts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const newsPost = await ctx.db.get(args.newsId);
    if (!newsPost) {
      throw new Error("News post not found");
    }

    const postId = await ctx.db.insert("posts", {
      userId: args.userId,
      tone: "Informative",
      angle: newsPost.topic,
      content: newsPost.content,
      status: "active",
      source: "news",
    });

    await ctx.db.patch(args.newsId, { savedToPost: true });

    return postId;
  },
});
