import { action } from "./_generated/server";
import { v } from "convex/values";

async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 2048
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text as string;
}

export const generatePosts = action({
  args: {
    userId: v.id("users"),
    apiKey: v.string(),
    profile: v.object({
      name: v.optional(v.string()),
      role: v.optional(v.string()),
      bio: v.optional(v.string()),
      audience: v.optional(v.string()),
      tone: v.optional(v.string()),
      avoid: v.optional(v.string()),
      contentPillars: v.optional(v.array(v.string())),
      projects: v.optional(v.string()),
      stack: v.optional(v.string()),
    }),
    lang: v.string(),
    count: v.number(),
  },
  handler: async (_ctx, args) => {
    const { profile, lang, count, apiKey } = args;

    const pillarsText =
      profile.contentPillars && profile.contentPillars.length > 0
        ? `Content pillars: ${profile.contentPillars.join(", ")}`
        : "";

    const systemPrompt = `You are an expert LinkedIn content strategist. Generate engaging LinkedIn posts for a professional.
Write in ${lang}.
Return ONLY a valid JSON array of objects with exactly these keys: "tone", "angle", "content".
No markdown, no code fences, no explanation — just the raw JSON array.`;

    const userMessage = `Create ${count} LinkedIn posts for this person:
Name: ${profile.name ?? "Unknown"}
Role: ${profile.role ?? "Professional"}
Bio: ${profile.bio ?? ""}
Target audience: ${profile.audience ?? "Professionals"}
Preferred tone: ${profile.tone ?? "Professional"}
Avoid: ${profile.avoid ?? "Nothing specific"}
Projects/products: ${profile.projects ?? ""}
Tech stack: ${profile.stack ?? ""}
${pillarsText}

Each post should:
- Start with a strong hook (first line creates curiosity or tension)
- Be 200-400 words with concrete details, numbers, and specifics
- Include a clear call to action or reflection question
- End with 3-5 relevant hashtags on a new line
- Feel authentic and human, not corporate

Return a JSON array with ${count} posts, each having:
- "tone": exactly one of: "builder", "insight", "story", "opinion", "tactical"
- "angle": a brief description of the angle/topic (1 sentence, no underscores)
- "content": the full post text including hashtags at the end`;

    const raw = await callClaude(apiKey, systemPrompt, userMessage, 4096);

    let posts: Array<{ tone: string; angle: string; content: string }>;
    try {
      posts = JSON.parse(raw);
    } catch {
      // Attempt to extract JSON array from response
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) {
        throw new Error("Failed to parse posts from Claude response");
      }
      posts = JSON.parse(match[0]);
    }

    return posts;
  },
});

export const scorePost = action({
  args: {
    apiKey: v.string(),
    content: v.string(),
  },
  handler: async (_ctx, args) => {
    const systemPrompt = `You are a LinkedIn content expert. Score a LinkedIn post on three dimensions.
Return ONLY a valid JSON object with keys: "hook" (0-10), "clarity" (0-10), "cta" (0-10), "feedback" (string), "overall" (0-10).
No markdown, no code fences, no explanation — just the raw JSON object.`;

    const userMessage = `Score this LinkedIn post:

${args.content}

Scoring criteria:
- hook (0-10): How compelling is the opening line? Does it make you want to read more?
- clarity (0-10): Is the message clear and easy to follow?
- cta (0-10): Does it have a strong call to action or engagement prompt?
- feedback (string): 2-3 sentences of specific, actionable improvement suggestions.
- overall (0-10): Overall quality score.`;

    const raw = await callClaude(args.apiKey, systemPrompt, userMessage, 512);

    let result: {
      hook: number;
      clarity: number;
      cta: number;
      feedback: string;
      overall: number;
    };
    try {
      result = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error("Failed to parse score from Claude response");
      }
      result = JSON.parse(match[0]);
    }

    return result;
  },
});

export const rewritePost = action({
  args: {
    apiKey: v.string(),
    content: v.string(),
    targetTone: v.string(),
    lang: v.string(),
  },
  handler: async (_ctx, args) => {
    const systemPrompt = `You are an expert LinkedIn copywriter. Rewrite posts while preserving the core message.
Write in ${args.lang}.
Return ONLY the rewritten post text. No explanation, no preamble, no quotation marks wrapping the post.`;

    const userMessage = `Rewrite this LinkedIn post in a "${args.targetTone}" tone:

${args.content}

Keep the core message and key points. Adjust the voice, structure, and phrasing to match the "${args.targetTone}" tone.`;

    return await callClaude(args.apiKey, systemPrompt, userMessage, 1024);
  },
});

export const parseUrlToPost = action({
  args: {
    apiKey: v.string(),
    url: v.string(),
    topic: v.string(),
    lang: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const lang = args.lang ?? "English";

    let html = "";
    try {
      const resp = await fetch(args.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PostPilot/1.0; +https://postpilot.ai)" },
        signal: AbortSignal.timeout(10000),
      });
      html = await resp.text();
    } catch {
      throw new Error("Could not fetch URL. Check the link and try again.");
    }

    // Strip scripts, styles, nav, footer, then all tags → plain text
    const text = html
      .replace(/<(script|style|nav|footer|header|aside)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 7000);

    const systemPrompt = `You are an expert LinkedIn content strategist.
Given an article, extract key information and write an engaging LinkedIn post.
Write in ${lang}.
Return ONLY a valid JSON object — no markdown, no code fences, just raw JSON.`;

    const userMessage = `Article URL: ${args.url}
Topic category: ${args.topic}

Article text (may be truncated):
${text}

Return a JSON object with:
- "headline": the article's main headline or title (concise, 1 sentence)
- "summary": 2-3 sentence factual summary of the article
- "tone": one of "builder", "insight", "story", "opinion", "tactical"
- "angle": the perspective/angle of the LinkedIn post (1 sentence, no underscores)
- "post": a compelling LinkedIn post about this article. Add your professional perspective and insight. 200-350 words. End with 3-5 relevant hashtags on a new line.`;

    const raw = await callClaude(args.apiKey, systemPrompt, userMessage, 2048);

    let result: { headline: string; summary: string; tone: string; angle: string; post: string };
    try {
      result = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Failed to parse response from Claude");
      result = JSON.parse(match[0]);
    }

    return result;
  },
});

export const analyzeSchedule = action({
  args: {
    apiKey: v.string(),
    stats: v.object({
      totalPosts: v.number(),
      avgLength: v.number(),
      avgScore: v.optional(v.number()),
      toneCounts: v.any(),
      scheduledCount: v.number(),
      topPostSamples: v.array(v.object({
        tone: v.string(),
        length: v.number(),
        score: v.optional(v.number()),
        preview: v.string(),
      })),
    }),
  },
  handler: async (_ctx, args) => {
    const { stats, apiKey } = args;

    const systemPrompt = `You are an expert LinkedIn growth strategist. Analyze a creator's content library and recommend a concrete posting schedule.
Return ONLY a valid JSON object — no markdown, no code fences, just raw JSON.`;

    const userMessage = `Analyze this LinkedIn content library and recommend a posting schedule:

Total posts in library: ${stats.totalPosts}
Average post length: ${stats.avgLength} characters
Average AI score: ${stats.avgScore !== undefined ? `${stats.avgScore}/10` : 'not scored yet'}
Scheduled posts: ${stats.scheduledCount}
Tone breakdown: ${JSON.stringify(stats.toneCounts)}

Top post samples:
${stats.topPostSamples.map((p, i) => `${i + 1}. [${p.tone}] ${p.score !== undefined ? `Score: ${p.score}/10 ` : ''}(${p.length} chars): "${p.preview}"`).join('\n')}

Return a JSON object with:
- "frequency": number of posts recommended per week (integer 1-7)
- "frequencyReason": 1-2 sentence explanation for the frequency
- "bestDays": array of 2-4 recommended day names (e.g. ["Tuesday", "Thursday", "Saturday"])
- "bestDaysReason": 1 sentence why these days
- "toneBalance": array of objects, each with "tone" (string), "currentPct" (number 0-100), "targetPct" (number 0-100), "action" (string: "increase"/"decrease"/"maintain"), "tip" (string: 1 sentence advice)
- "tips": array of 3-5 actionable string tips specific to this person's content
- "summary": 2-3 sentence overall assessment of their content strategy`;

    const raw = await callClaude(apiKey, systemPrompt, userMessage, 1500);

    let result: {
      frequency: number;
      frequencyReason: string;
      bestDays: string[];
      bestDaysReason: string;
      toneBalance: Array<{ tone: string; currentPct: number; targetPct: number; action: string; tip: string }>;
      tips: string[];
      summary: string;
    };
    try {
      result = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Failed to parse schedule analysis from Claude");
      result = JSON.parse(match[0]);
    }

    return result;
  },
});

export const generateVariants = action({
  args: {
    apiKey: v.string(),
    content: v.string(),
    lang: v.string(),
  },
  handler: async (_ctx, args) => {
    const systemPrompt = `You are an expert LinkedIn copywriter. Generate post variants.
Write in ${args.lang}.
Return ONLY a valid JSON array of exactly 3 strings, each being a complete variant post.
No markdown, no code fences, no explanation — just the raw JSON array.`;

    const userMessage = `Generate 3 different variants of this LinkedIn post. Each variant should:
- Preserve the core message and key points
- Use a distinctly different angle, structure, or tone
- Be complete and ready to publish

Original post:
${args.content}`;

    const raw = await callClaude(args.apiKey, systemPrompt, userMessage, 2048);

    let variants: string[];
    try {
      variants = JSON.parse(raw);
    } catch {
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) {
        throw new Error("Failed to parse variants from Claude response");
      }
      variants = JSON.parse(match[0]);
    }

    return variants;
  },
});
