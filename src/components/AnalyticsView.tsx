import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useQuery, useAction, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { type User } from '../lib/auth';

interface Props {
  user: User;
  prefs: any;
  demoMode: boolean;
}

const TONE_COLORS: Record<string, string> = {
  builder: '#6b4fff',
  insight: '#10b981',
  story: '#f59e0b',
  opinion: '#ef4444',
  tactical: '#0077b5',
  storytelling: '#f59e0b',
  educational: '#10b981',
  motivational: '#6b4fff',
  conversational: '#8b6fff',
  professional: '#60607a',
  informative: '#0077b5',
};

function toneColor(tone: string) {
  return TONE_COLORS[tone.toLowerCase()] || '#8b6fff';
}

function normalizedTone(tone: string): string {
  return tone.toLowerCase().trim();
}


interface ScheduleResult {
  frequency: number;
  frequencyReason: string;
  bestDays: string[];
  bestDaysReason: string;
  toneBalance: Array<{ tone: string; currentPct: number; targetPct: number; action: string; tip: string }>;
  tips: string[];
  summary: string;
}

export default function AnalyticsView({ user, prefs, demoMode }: Props) {
  const [scoring, setScoring] = useState(false);
  const [scoringProgress, setScoringProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState('');

  const posts = useQuery(
    api.posts.getPosts,
    !demoMode ? { userId: user._id as any, status: 'active' as const } : 'skip'
  );
  const scheduledPosts = useQuery(
    api.posts.getPosts,
    !demoMode ? { userId: user._id as any, status: 'scheduled' as const } : 'skip'
  );

  const scorePostAction = useAction(api.ai.scorePost);
  const analyzeScheduleAction = useAction(api.ai.analyzeSchedule);
  const updatePost = useMutation(api.posts.updatePost);

  const allPosts = demoMode ? [] : (posts ?? []);
  const scheduled = demoMode ? [] : (scheduledPosts ?? []);
  const isLoading = !demoMode && (posts === undefined || scheduledPosts === undefined);

  // --- Derived stats ---
  const totalPosts = allPosts.length;
  const avgLength = totalPosts === 0
    ? 0
    : Math.round(allPosts.reduce((s, p) => s + p.content.length, 0) / totalPosts);

  // Tone breakdown
  const toneCounts: Record<string, number> = {};
  for (const post of allPosts) {
    const t = normalizedTone(post.tone);
    toneCounts[t] = (toneCounts[t] ?? 0) + 1;
  }
  const toneEntries = Object.entries(toneCounts).sort((a, b) => b[1] - a[1]);
  const mostUsedTone = toneEntries[0]?.[0] ?? '—';

  // Score stats
  const scoredPosts = allPosts.filter(p => (p as any).score !== undefined && (p as any).score !== null);
  const avgScore = scoredPosts.length === 0
    ? null
    : Math.round((scoredPosts.reduce((s, p) => s + (p as any).score, 0) / scoredPosts.length) * 10) / 10;

  const scoreDistribution = [
    { label: '9–10', min: 9, max: 10 },
    { label: '7–8', min: 7, max: 9 },
    { label: '5–6', min: 5, max: 7 },
    { label: '0–4', min: 0, max: 5 },
  ].map(bucket => ({
    ...bucket,
    count: scoredPosts.filter(p => {
      const sc = (p as any).score;
      return sc >= bucket.min && sc < bucket.max;
    }).length,
  }));

  // Length buckets
  const lengthBuckets = [
    { label: 'Short (<500)', count: allPosts.filter(p => p.content.length < 500).length },
    { label: 'Medium (500–1000)', count: allPosts.filter(p => p.content.length >= 500 && p.content.length <= 1000).length },
    { label: 'Long (>1000)', count: allPosts.filter(p => p.content.length > 1000).length },
  ];

  // Top posts
  const topPosts = [...allPosts]
    .sort((a, b) => {
      const sa = (a as any).score ?? null;
      const sb = (b as any).score ?? null;
      if (sa !== null && sb !== null) return sb - sa;
      if (sa !== null) return -1;
      if (sb !== null) return 1;
      return b.content.length - a.content.length;
    })
    .slice(0, 5);

  // Recommendations
  const recommendations: string[] = [];
  const toneVariety = Object.keys(toneCounts).length;
  if (toneVariety < 3 && totalPosts > 5) {
    recommendations.push('Try adding more tone variety — mixing Builder, Insight, and Story posts increases reach.');
  }
  if (avgLength > 0 && avgLength < 400) {
    recommendations.push('Longer posts (600–900 chars) tend to get more engagement. Try adding more context or examples.');
  }
  if (avgLength > 1200) {
    recommendations.push('Your posts are quite long. Consider tightening to 800–1000 chars for better readability on mobile.');
  }
  if (scoredPosts.length === 0 && totalPosts > 0) {
    recommendations.push('Score your posts to identify which formats work best for your audience.');
  }
  if (avgScore !== null && avgScore < 6) {
    recommendations.push('Your average score is below 6. Focus on stronger hooks and clearer calls to action.');
  }
  if (scheduled.length === 0 && totalPosts > 3) {
    recommendations.push('You have posts ready but nothing scheduled. Use the Planner to map out your content calendar.');
  }

  const hasApiKey = prefs?.apikey?.startsWith('sk-ant');

  const handleScoreAll = async () => {
    if (!hasApiKey || !prefs?.apikey) return;
    const unscored = allPosts.filter(p => (p as any).score === undefined || (p as any).score === null);
    if (unscored.length === 0) return;
    setScoring(true);
    setScoringProgress(0);
    let done = 0;
    for (const post of unscored) {
      try {
        const result = await scorePostAction({ apiKey: prefs.apikey, content: post.content });
        await updatePost({
          postId: post._id as any,
          score: result.overall,
          scoreDetails: {
            hook: result.hook,
            clarity: result.clarity,
            cta: result.cta,
            feedback: result.feedback,
          },
        });
      } catch (e) {
        console.error('Scoring failed for post', post._id, e);
      }
      done++;
      setScoringProgress(Math.round((done / unscored.length) * 100));
    }
    setScoring(false);
  };

  const handleAnalyze = async () => {
    if (!hasApiKey || !prefs?.apikey) return;
    setAnalyzing(true);
    setAnalyzeError('');
    try {
      const topSamples = [...allPosts]
        .sort((a, b) => ((b as any).score ?? 0) - ((a as any).score ?? 0))
        .slice(0, 5)
        .map(p => ({
          tone: p.tone,
          length: p.content.length,
          score: (p as any).score as number | undefined,
          preview: p.content.slice(0, 80),
        }));

      const result = await analyzeScheduleAction({
        apiKey: prefs.apikey,
        stats: {
          totalPosts,
          avgLength,
          avgScore: avgScore ?? undefined,
          toneCounts,
          scheduledCount: scheduled.length,
          topPostSamples: topSamples,
        },
      });
      setScheduleResult(result as ScheduleResult);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // --- Styles ---
  const root: CSSProperties = { padding: 24, animation: 'fadeIn .2s ease' };

  const statRowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 24,
  };

  const statCard = (accent?: string): CSSProperties => ({
    background: 'var(--s1)',
    border: `1px solid ${accent ? `${accent}33` : 'var(--bd)'}`,
    borderRadius: 'var(--r2)',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  });

  const statNum: CSSProperties = {
    fontFamily: 'var(--head)',
    fontSize: 30,
    fontWeight: 800,
    color: 'var(--t1)',
    lineHeight: 1,
  };

  const statLabel: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--t3)',
    textTransform: 'uppercase',
    letterSpacing: '.5px',
  };

  const sectionStyle: CSSProperties = {
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r2)',
    padding: 20,
    marginBottom: 20,
  };

  const sectionTitle: CSSProperties = {
    fontFamily: 'var(--head)',
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--t1)',
    marginBottom: 16,
    letterSpacing: '.2px',
  };

  const twoColStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 20,
  };

  if (isLoading) {
    return (
      <div style={root}>
        <div style={{ color: 'var(--t3)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
          Loading analytics...
        </div>
      </div>
    );
  }

  if (demoMode || totalPosts === 0) {
    return (
      <div style={root}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>◑</div>
          <div style={{ fontFamily: 'var(--head)', fontSize: 17, fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}>
            {demoMode ? 'Analytics not available in demo mode' : 'No posts to analyze yet'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.6 }}>
            {demoMode
              ? 'Sign in to track your content performance and get insights.'
              : 'Generate some posts first, then come back here for insights.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={root}>
      {/* Top stats row */}
      <div style={statRowStyle}>
        <div style={statCard('var(--ac)')}>
          <div style={{ ...statNum, color: 'var(--ac2)' }}>{totalPosts}</div>
          <div style={statLabel}>Total Posts</div>
        </div>
        <div style={statCard()}>
          <div style={statNum}>{avgLength}</div>
          <div style={statLabel}>Avg Length (chars)</div>
        </div>
        <div style={statCard(toneColor(mostUsedTone))}>
          <div style={{ ...statNum, fontSize: 22, textTransform: 'capitalize', color: toneColor(mostUsedTone) }}>
            {mostUsedTone}
          </div>
          <div style={statLabel}>Most Used Tone</div>
        </div>
        <div style={statCard('#0077b5')}>
          <div style={{ ...statNum, color: '#0077b5' }}>{scheduled.length}</div>
          <div style={statLabel}>Scheduled Posts</div>
        </div>
      </div>

      {/* Two column: Tone Breakdown + Length Analysis */}
      <div style={twoColStyle}>
        {/* Tone Breakdown */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Tone Breakdown</div>
          {toneEntries.length === 0 ? (
            <div style={{ color: 'var(--t3)', fontSize: 13 }}>No data</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {toneEntries.map(([tone, count]) => {
                const pct = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;
                const color = toneColor(tone);
                return (
                  <div key={tone}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', textTransform: 'capitalize' }}>
                        {tone}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
                        {count} · {pct}%
                      </span>
                    </div>
                    <div style={{ height: 8, background: 'var(--s3)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: color,
                        borderRadius: 4,
                        transition: 'width .4s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Length Analysis */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Length Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lengthBuckets.map(bucket => {
              const pct = totalPosts > 0 ? Math.round((bucket.count / totalPosts) * 100) : 0;
              return (
                <div key={bucket.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)' }}>{bucket.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
                      {bucket.count} · {pct}%
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'var(--s3)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: 'var(--ac)',
                      opacity: 0.7,
                      borderRadius: 4,
                      transition: 'width .4s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Post Score Analysis */}
      <div style={{ ...sectionStyle, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={sectionTitle}>Post Score Analysis</div>
          {scoredPosts.length < allPosts.length && hasApiKey && !demoMode && (
            <button
              style={{
                padding: '7px 16px',
                background: scoring ? 'var(--s3)' : 'var(--ac)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--r)',
                fontFamily: 'var(--head)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: scoring ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: scoring ? 0.8 : 1,
              }}
              onClick={handleScoreAll}
              disabled={scoring}
            >
              {scoring
                ? `Scoring... ${scoringProgress}%`
                : `Score ${allPosts.length - scoredPosts.length} Posts`}
            </button>
          )}
        </div>

        {scoredPosts.length === 0 ? (
          <div style={{ color: 'var(--t3)', fontSize: 13, lineHeight: 1.6 }}>
            No posts have been scored yet.
            {hasApiKey
              ? ' Click "Score Posts" above to analyze your posts with AI.'
              : ' Add your Anthropic API key in Settings to enable AI scoring.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--ac2)', lineHeight: 1, fontFamily: 'var(--head)' }}>
                {avgScore}
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>Avg Score</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{scoredPosts.length} scored</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8 }}>Score Distribution</div>
              {scoreDistribution.map(bucket => {
                const pct = scoredPosts.length > 0 ? Math.round((bucket.count / scoredPosts.length) * 100) : 0;
                const bucketColor = bucket.min >= 9 ? '#10b981' : bucket.min >= 7 ? '#6b4fff' : bucket.min >= 5 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={bucket.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--t2)' }}>{bucket.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
                        {bucket.count} · {pct}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--s3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: bucketColor,
                        borderRadius: 3,
                        transition: 'width .4s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Top Posts */}
      <div style={{ ...sectionStyle, marginBottom: 20 }}>
        <div style={sectionTitle}>
          {scoredPosts.length > 0 ? 'Top Posts by Score' : 'Top Posts by Length'}
        </div>
        {topPosts.length === 0 ? (
          <div style={{ color: 'var(--t3)', fontSize: 13 }}>No posts yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topPosts.map((post, i) => {
              const score = (post as any).score as number | undefined;
              return (
                <div
                  key={post._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 14px',
                    background: 'var(--s2)',
                    borderRadius: 'var(--r)',
                    border: '1px solid var(--bd)',
                  }}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: i === 0 ? 'var(--ac)' : 'var(--s3)',
                    color: i === 0 ? '#fff' : 'var(--t3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 700,
                        background: `${toneColor(post.tone)}22`,
                        color: toneColor(post.tone),
                        border: `1px solid ${toneColor(post.tone)}44`,
                        textTransform: 'uppercase',
                        letterSpacing: '.3px',
                      }}>
                        {post.tone}
                      </span>
                      {score !== undefined && (
                        <span style={{ fontSize: 12, color: 'var(--ok)', fontWeight: 600 }}>
                          ★ {score}/10
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)', marginLeft: 'auto' }}>
                        {post.content.length}c
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>
                      {post.content.slice(0, 100)}{post.content.length > 100 ? '…' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitle}>Quick Tips</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.map((tip, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'rgba(107,79,255,.06)',
                  borderRadius: 'var(--r)',
                  border: '1px solid rgba(107,79,255,.15)',
                }}
              >
                <span style={{ color: 'var(--ac2)', fontSize: 14, flexShrink: 0, marginTop: 1 }}>✦</span>
                <span style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.55 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Schedule Analysis */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: scheduleResult ? 20 : 0 }}>
          <div style={{ ...sectionTitle, marginBottom: 0 }}>AI Posting Plan</div>
          {hasApiKey ? (
            <button
              style={{
                padding: '7px 16px',
                background: analyzing ? 'var(--s3)' : 'var(--ac)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--r)',
                fontFamily: 'var(--head)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: analyzing ? 'not-allowed' : 'pointer',
                opacity: analyzing ? 0.8 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? 'Analyzing...' : scheduleResult ? 'Re-analyze' : '✦ Analyze with AI'}
            </button>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>Add API key in Settings to enable</span>
          )}
        </div>

        {analyzeError && (
          <div style={{ fontSize: 13, color: 'var(--err)', padding: '8px 0' }}>{analyzeError}</div>
        )}

        {!scheduleResult && !analyzing && (
          <div style={{ fontSize: 13, color: 'var(--t3)', paddingTop: hasApiKey ? 14 : 0, lineHeight: 1.6 }}>
            {hasApiKey
              ? 'Click "Analyze with AI" to get a personalized posting schedule based on your content library.'
              : 'Connect your Anthropic API key in Settings to get a personalized posting schedule.'}
          </div>
        )}

        {analyzing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: 'var(--t3)', fontSize: 13 }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>◑</span>
            Claude is analyzing your content...
          </div>
        )}

        {scheduleResult && !analyzing && (
          <div>
            {/* Summary */}
            <div style={{
              padding: '12px 16px',
              background: 'rgba(107,79,255,.06)',
              border: '1px solid rgba(107,79,255,.15)',
              borderRadius: 'var(--r)',
              fontSize: 13.5,
              color: 'var(--t2)',
              lineHeight: 1.6,
              marginBottom: 20,
            }}>
              {scheduleResult.summary}
            </div>

            {/* Frequency + Best Days */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                  Recommended Frequency
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--ac2)', fontFamily: 'var(--head)', lineHeight: 1 }}>
                    {scheduleResult.frequency}×
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--t3)' }}>per week</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>{scheduleResult.frequencyReason}</div>
              </div>

              <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                  Best Days to Post
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {scheduleResult.bestDays.map(day => (
                    <span key={day} style={{
                      padding: '4px 10px',
                      background: 'rgba(107,79,255,.15)',
                      color: 'var(--ac2)',
                      border: '1px solid rgba(107,79,255,.3)',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {day}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>{scheduleResult.bestDaysReason}</div>
              </div>
            </div>

            {/* Tone Balance */}
            {scheduleResult.toneBalance.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
                  Recommended Tone Mix
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {scheduleResult.toneBalance.map(tb => {
                    const color = toneColor(tb.tone);
                    const actionColor = tb.action === 'increase' ? '#10b981' : tb.action === 'decrease' ? '#ef4444' : '#6b4fff';
                    const actionIcon = tb.action === 'increase' ? '↑' : tb.action === 'decrease' ? '↓' : '→';
                    return (
                      <div key={tb.tone} style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 'var(--r)', padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                            background: `${color}22`, color, border: `1px solid ${color}44`,
                            textTransform: 'uppercase', letterSpacing: '.3px',
                          }}>
                            {tb.tone}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                            now {tb.currentPct}% → target {tb.targetPct}%
                          </span>
                          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: actionColor }}>
                            {actionIcon} {tb.action}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--s3)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                            <div style={{ position: 'absolute', height: '100%', width: `${tb.currentPct}%`, background: color, opacity: 0.5, borderRadius: 3, transition: 'width .4s' }} />
                            <div style={{ position: 'absolute', top: 0, height: '100%', width: 2, left: `${tb.targetPct}%`, background: actionColor, borderRadius: 1 }} />
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6, lineHeight: 1.5 }}>{tb.tip}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actionable Tips */}
            {scheduleResult.tips.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
                  Action Items
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {scheduleResult.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%', background: 'rgba(107,79,255,.15)',
                        color: 'var(--ac2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.55 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
