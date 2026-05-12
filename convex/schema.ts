import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    picture: v.optional(v.string()),
    googleSub: v.optional(v.string()),
    uiLang: v.optional(v.string()),
  }).index("by_email", ["email"]),

  prefs: defineTable({
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
  }).index("by_userId", ["userId"]),

  posts: defineTable({
    userId: v.id("users"),
    tone: v.string(),
    angle: v.string(),
    content: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("deleted"),
      v.literal("scheduled"),
      v.literal("published")
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
  })
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_userId_scheduled", ["userId", "scheduledDate"]),

  ideas: defineTable({
    userId: v.id("users"),
    content: v.string(),
    source: v.string(),
    used: v.boolean(),
  }).index("by_userId", ["userId"]),

  newsPosts: defineTable({
    userId: v.id("users"),
    topic: v.string(),
    headline: v.string(),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    savedToPost: v.boolean(),
  }).index("by_userId", ["userId"]),
});
