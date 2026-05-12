import { useState, CSSProperties } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { type User } from '../lib/auth';

interface Prefs {
  _id?: string;
  userId?: string;
  name: string;
  role?: string;
  bio?: string;
  audience?: string;
  tone?: string;
  avoid?: string;
  lang?: string;
  apikey?: string;
  projects?: string;
  stack?: string;
  contentPillars?: string[];
}

interface Props {
  user: User;
  prefs: Prefs | null;
  search: string;
  demoMode: boolean;
}

const TONES = ['all', 'builder', 'insight', 'story', 'opinion', 'tactical'];

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
  const k = tone.toLowerCase();
  return TONE_COLORS[k] || 'var(--t3)';
}

const DEMO_POSTS = [
  {
    _id: 'demo1',
    tone: 'Builder',
    angle: 'Sharing the journey of building in public',
    content: "I shipped 3 features this week while keeping my day job.\n\nHere's how I stay productive:\n\n1. Morning blocks (5-7am, no meetings)\n2. Clear atomic goals per session\n3. Ship, then improve\n\nPerfect is the enemy of shipped.\n\nWhat's your go-to productivity hack?",
    status: 'active',
  },
  {
    _id: 'demo2',
    tone: 'Insight',
    angle: 'Why most LinkedIn posts fail to get engagement',
    content: "Most LinkedIn posts fail for one reason:\n\nThey start with the conclusion.\n\nYour hook needs to create tension, not resolve it.\n\nInstead of: 'Here's how I grew to 10k followers'\nTry: 'I did everything wrong for 6 months — then this happened'\n\nCuriosity drives clicks. Tension drives reads.\n\nWhich hook style works best for you?",
    status: 'active',
  },
  {
    _id: 'demo3',
    tone: 'Story',
    angle: 'A failure that became a turning point',
    content: "My startup failed in 2021.\n\nWe had a product, users, and traction.\n\nBut we had no business model.\n\nI spent 6 months rebuilding — this time with revenue in mind from day one.\n\n3 lessons I wish I'd learned earlier:\n- Distribution > product at early stage\n- Talk to customers before building\n- Revenue validates faster than users\n\nFailure is the sharpest teacher.",
    status: 'active',
  },
];

const s: Record<string, CSSProperties> = {
  root: {
    padding: 24,
    animation: 'fadeIn .2s ease',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  chips: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  chip: (active: boolean): CSSProperties => ({
    padding: '5px 14px',
    borderRadius: 20,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: 'pointer',
    border: active ? '1px solid var(--ac)' : '1px solid var(--bd)',
    background: active ? 'rgba(107,79,255,.15)' : 'var(--s1)',
    color: active ? 'var(--ac2)' : 'var(--t3)',
    transition: 'all .15s',
    fontFamily: 'var(--head)',
    textTransform: 'capitalize' as const,
  }),
  generateBtn: {
    padding: '9px 20px',
    background: 'var(--ac)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--r)',
    fontFamily: 'var(--head)',
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    transition: 'all .15s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
    gap: 16,
  },
  card: {
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r2)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    transition: 'border-color .2s',
    animation: 'fadeIn .25s ease',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  toneBadge: (tone: string): CSSProperties => ({
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    background: `${toneColor(tone)}22`,
    color: toneColor(tone),
    border: `1px solid ${toneColor(tone)}44`,
    letterSpacing: '.3px',
    textTransform: 'uppercase' as const,
    flexShrink: 0,
  }),
  charCount: {
    fontSize: 11,
    color: 'var(--t3)',
    fontFamily: 'var(--mono)',
  },
  angle: {
    fontSize: 12.5,
    color: 'var(--t3)',
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  content: {
    fontSize: 13.5,
    color: 'var(--t2)',
    lineHeight: 1.65,
    display: '-webkit-box',
    WebkitLineClamp: 5,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    cursor: 'pointer',
  },
  contentExpanded: {
    fontSize: 13.5,
    color: 'var(--t2)',
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap' as const,
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    gap: 6,
    marginTop: 'auto',
  },
  actionBtn: {
    flex: 1,
    padding: '7px 0',
    background: 'var(--s2)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    color: 'var(--t3)',
    fontFamily: 'var(--head)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all .15s',
  },
  deleteBtn: {
    padding: '7px 10px',
    background: 'none',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    color: 'var(--t3)',
    fontFamily: 'var(--head)',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all .15s',
  },
  skeletonCard: {
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r2)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  skeletonLine: (w: string, h = 12): CSSProperties => ({
    height: h,
    background: 'var(--s3)',
    borderRadius: 4,
    width: w,
  }),
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyTitle: {
    fontFamily: 'var(--head)',
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--t2)',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'var(--t3)',
    marginBottom: 24,
    lineHeight: 1.6,
  },
  genBtnLarge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 28px',
    background: 'var(--ac)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--r)',
    fontFamily: 'var(--head)',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all .15s',
  },
  scheduleModal: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    backdropFilter: 'blur(4px)',
  },
  scheduleCard: {
    background: 'var(--s1)',
    border: '1px solid var(--bd2)',
    borderRadius: 'var(--r2)',
    padding: 28,
    width: 340,
    maxWidth: '95vw',
  },
  modalTitle: {
    fontFamily: 'var(--head)',
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--t1)',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    color: 'var(--t2)',
    fontWeight: 500,
    marginBottom: 6,
    display: 'block',
  },
  modalInput: {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--s2)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    color: 'var(--t1)',
    fontSize: 14,
    outline: 'none',
    marginBottom: 16,
    fontFamily: 'var(--head)',
  },
  modalBtns: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
  },
};

interface ScheduleModal {
  postId: string;
  content: string;
}

export default function PostsView({ user, prefs, search, demoMode }: Props) {
  const [toneFilter, setToneFilter] = useState('all');
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scheduleModal, setScheduleModal] = useState<ScheduleModal | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const rawPosts = useQuery(
    api.posts.getPosts,
    !demoMode ? { userId: user._id as any, status: 'active' as const } : 'skip'
  );

  const posts = demoMode ? DEMO_POSTS : (rawPosts ?? []);

  const generatePostsAction = useAction(api.ai.generatePosts);
  const createManyPosts = useMutation(api.posts.createManyPosts);
  const deletePostMut = useMutation(api.posts.deletePost);
  const setStatus = useMutation(api.posts.setStatus);

  const hasApiKey = prefs?.apikey?.startsWith('sk-ant');

  const filteredPosts = posts.filter(p => {
    if (toneFilter !== 'all') {
      if (!p.tone.toLowerCase().includes(toneFilter.toLowerCase())) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        p.content.toLowerCase().includes(q) ||
        p.angle.toLowerCase().includes(q) ||
        p.tone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleGenerate = async () => {
    if (!prefs?.apikey || !hasApiKey) return;
    setGenerating(true);
    try {
      const generated = await generatePostsAction({
        userId: user._id as any,
        apiKey: prefs.apikey,
        profile: {
          name: prefs.name,
          role: prefs.role,
          bio: prefs.bio,
          audience: prefs.audience,
          tone: prefs.tone,
          avoid: prefs.avoid,
          contentPillars: prefs.contentPillars,
          projects: prefs.projects,
          stack: prefs.stack,
        },
        lang: prefs.lang || 'English',
        count: 9,
      });
      await createManyPosts({
        userId: user._id as any,
        posts: generated,
      });
    } catch (e) {
      console.error('Generation failed:', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (demoMode) return;
    await deletePostMut({ postId: postId as any });
  };

  const handleCopy = (postId: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(postId);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleSchedule = (postId: string, content: string) => {
    if (demoMode) return;
    setScheduleModal({ postId, content });
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setScheduleDate(d.toISOString().slice(0, 10));
  };

  const confirmSchedule = async () => {
    if (!scheduleModal || !scheduleDate) return;
    await setStatus({
      postId: scheduleModal.postId as any,
      status: 'scheduled',
      scheduledDate: scheduleDate,
    });
    setScheduleModal(null);
  };

  const isLoading = !demoMode && rawPosts === undefined;
  const isEmpty = !isLoading && !generating && posts.length === 0;

  return (
    <div style={s.root}>
      <div style={s.toolbar}>
        <div style={s.chips}>
          {TONES.map(t => (
            <button
              key={t}
              style={s.chip(toneFilter === t)}
              onClick={() => setToneFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {hasApiKey && !demoMode && (
          <button
            style={{ ...s.generateBtn, opacity: generating ? 0.7 : 1 }}
            onClick={handleGenerate}
            disabled={generating}
            onMouseEnter={e => { if (!generating) e.currentTarget.style.background = 'var(--ac2)'; }}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--ac)')}
          >
            {generating ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                Generating...
              </>
            ) : '✦ Generate Posts'}
          </button>
        )}
      </div>

      <div style={s.grid}>
        {generating && Array.from({ length: 9 }).map((_, i) => (
          <div key={`sk-${i}`} style={s.skeletonCard}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={s.skeletonLine('25%', 18)} />
              <div style={{ flex: 1 }} />
              <div style={s.skeletonLine('15%', 14)} />
            </div>
            <div style={s.skeletonLine('80%', 11)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={s.skeletonLine('100%')} />
              <div style={s.skeletonLine('90%')} />
              <div style={s.skeletonLine('95%')} />
              <div style={s.skeletonLine('70%')} />
            </div>
          </div>
        ))}

        {!generating && filteredPosts.map(post => {
          const isExpanded = expandedId === post._id;
          return (
            <div
              key={post._id}
              style={s.card}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(107,79,255,.25)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
            >
              <div style={s.cardTop}>
                <span style={s.toneBadge(post.tone)}>{post.tone}</span>
                <span style={s.charCount}>{post.content.length}c</span>
              </div>

              <div style={s.angle}>{post.angle}</div>

              <div
                style={isExpanded ? s.contentExpanded : s.content}
                onClick={() => setExpandedId(isExpanded ? null : post._id)}
                title={isExpanded ? 'Click to collapse' : 'Click to expand'}
              >
                {post.content}
              </div>

              {isExpanded && (
                <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'right' as const }}>
                  Click to collapse
                </div>
              )}

              <div style={s.actions}>
                <button
                  style={{
                    ...s.actionBtn,
                    ...(copied === post._id ? { color: 'var(--ok)', borderColor: 'var(--ok)' } : {}),
                  }}
                  onClick={() => handleCopy(post._id, post.content)}
                  onMouseEnter={e => {
                    if (copied !== post._id) {
                      e.currentTarget.style.background = 'var(--s3)';
                      e.currentTarget.style.color = 'var(--t2)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (copied !== post._id) {
                      e.currentTarget.style.background = 'var(--s2)';
                      e.currentTarget.style.color = 'var(--t3)';
                    }
                  }}
                >
                  {copied === post._id ? '✓ Copied' : 'Copy'}
                </button>
                <button
                  style={s.actionBtn}
                  onClick={() => handleSchedule(post._id, post.content)}
                  disabled={demoMode}
                  title={demoMode ? 'Sign in to schedule' : 'Schedule post'}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--s3)';
                    e.currentTarget.style.color = 'var(--t2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--s2)';
                    e.currentTarget.style.color = 'var(--t3)';
                  }}
                >
                  Schedule
                </button>
                <button
                  style={s.deleteBtn}
                  onClick={() => handleDelete(post._id)}
                  disabled={demoMode}
                  title="Delete post"
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--err)';
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--t3)';
                    e.currentTarget.style.borderColor = 'var(--bd)';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}

        {isEmpty && (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>◈</div>
            <div style={s.emptyTitle}>
              {hasApiKey ? 'Ready to generate posts' : 'No posts yet'}
            </div>
            <div style={s.emptyText}>
              {hasApiKey
                ? 'Generate AI-powered LinkedIn posts tailored to your profile and audience.'
                : 'Add your Anthropic API key in Settings to start generating posts with AI.'}
            </div>
            {hasApiKey && !demoMode && (
              <button
                style={s.genBtnLarge}
                onClick={handleGenerate}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--ac2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--ac)')}
              >
                ✦ Generate 9 Posts
              </button>
            )}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {scheduleModal && (
        <div style={s.scheduleModal} onClick={() => setScheduleModal(null)}>
          <div style={s.scheduleCard} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>Schedule Post</div>
            <label style={s.modalLabel}>Date</label>
            <input
              style={s.modalInput}
              type="date"
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
            <div style={s.modalBtns}>
              <button
                style={{
                  padding: '9px 18px',
                  background: 'none',
                  border: '1px solid var(--bd)',
                  borderRadius: 'var(--r)',
                  color: 'var(--t2)',
                  fontFamily: 'var(--head)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
                onClick={() => setScheduleModal(null)}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: '9px 18px',
                  background: 'var(--ac)',
                  border: 'none',
                  borderRadius: 'var(--r)',
                  color: '#fff',
                  fontFamily: 'var(--head)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onClick={confirmSchedule}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
