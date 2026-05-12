import type { CSSProperties } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { type User } from '../lib/auth';

interface Props {
  user: User;
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
  default: '#8b6fff',
};

function toneColor(tone: string) {
  return TONE_COLORS[tone.toLowerCase()] || TONE_COLORS.default;
}

const DEMO_SCHEDULED = [
  {
    _id: 'ds1',
    tone: 'Builder',
    angle: 'Week review',
    content: 'I shipped 3 features this week while keeping my day job. Here\'s how I stay productive...',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    status: 'scheduled',
  },
  {
    _id: 'ds2',
    tone: 'Insight',
    angle: 'LinkedIn hooks',
    content: 'Most LinkedIn posts fail for one reason: they start with the conclusion...',
    scheduledDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    status: 'scheduled',
  },
];

const s: Record<string, CSSProperties | ((...args: any[]) => CSSProperties)> = {
  root: {
    padding: 24,
    animation: 'fadeIn .2s ease',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxWidth: 700,
  },
  card: {
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r2)',
    padding: 18,
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    transition: 'border-color .15s',
  },
  dateCol: {
    flexShrink: 0,
    textAlign: 'center' as const,
    width: 50,
  },
  dateDayNum: {
    fontFamily: 'var(--head)',
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--ac2)',
    lineHeight: 1,
  },
  dateMonth: {
    fontSize: 11,
    color: 'var(--t3)',
    fontWeight: 600,
    letterSpacing: '.5px',
    textTransform: 'uppercase' as const,
  },
  content: {
    flex: 1,
  },
  toneRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  toneBadge: (tone: string): CSSProperties => ({
    fontSize: 10,
    fontWeight: 700,
    color: toneColor(tone),
    textTransform: 'uppercase' as const,
    letterSpacing: '.5px',
  }),
  angle: {
    fontSize: 12,
    color: 'var(--t3)',
    fontStyle: 'italic',
  },
  postText: {
    fontSize: 13.5,
    color: 'var(--t2)',
    lineHeight: 1.6,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    marginBottom: 10,
  },
  actions: {
    display: 'flex',
    gap: 6,
  },
  actionBtn: {
    padding: '5px 12px',
    background: 'var(--s2)',
    border: '1px solid var(--bd)',
    borderRadius: 6,
    color: 'var(--t3)',
    fontFamily: 'var(--head)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all .15s',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: 'var(--t3)',
    fontSize: 14,
  },
  emptyIcon: {
    fontSize: 36,
    opacity: 0.3,
    marginBottom: 14,
    display: 'block',
  },
  emptyTitle: {
    fontFamily: 'var(--head)',
    fontWeight: 600,
    color: 'var(--t2)',
    marginBottom: 6,
  },
};

export default function ScheduleView({ user, demoMode }: Props) {
  const scheduledPosts = useQuery(
    api.posts.getPosts,
    !demoMode ? { userId: user._id as any, status: 'scheduled' as const } : 'skip'
  );

  const posts = demoMode ? DEMO_SCHEDULED : (scheduledPosts ?? []);
  const setStatus = useMutation(api.posts.setStatus);

  const sorted = [...posts].sort((a, b) => {
    if (!a.scheduledDate) return 1;
    if (!b.scheduledDate) return -1;
    return a.scheduledDate.localeCompare(b.scheduledDate);
  });

  const handleUnschedule = async (postId: string) => {
    if (demoMode) return;
    await setStatus({ postId: postId as any, status: 'active' });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      day: d.getDate(),
      month: d.toLocaleString('en', { month: 'short' }),
      weekday: d.toLocaleString('en', { weekday: 'short' }),
    };
  };

  if (sorted.length === 0) {
    return (
      <div style={s.root}>
        <div style={s.empty}>
          <span style={s.emptyIcon}>◉</span>
          <div style={s.emptyTitle}>No scheduled posts</div>
          <div>Schedule posts from the Posts tab to see them here.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.root}>
      <div style={s.list}>
        {sorted.map(post => {
          const date = post.scheduledDate ? formatDate(post.scheduledDate) : null;
          return (
            <div
              key={post._id}
              style={s.card}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(107,79,255,.25)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
            >
              {date && (
                <div style={s.dateCol}>
                  <div style={s.dateDayNum}>{date.day}</div>
                  <div style={s.dateMonth}>{date.month}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{date.weekday}</div>
                </div>
              )}
              <div style={s.content}>
                <div style={s.toneRow}>
                  <span style={s.toneBadge(post.tone)}>{post.tone}</span>
                  <span style={{ color: 'var(--bd)', fontSize: 12 }}>•</span>
                  <span style={s.angle}>{post.angle}</span>
                </div>
                <div style={s.postText}>{post.content}</div>
                <div style={s.actions}>
                  <button
                    style={s.actionBtn}
                    onClick={() => handleCopy(post.content)}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.background = 'var(--s3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'var(--s2)'; }}
                  >
                    Copy
                  </button>
                  <button
                    style={s.actionBtn}
                    onClick={() => handleUnschedule(post._id)}
                    disabled={demoMode}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--err)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--bd)'; }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
