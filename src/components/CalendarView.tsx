import { useState, CSSProperties } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { type User } from '../lib/auth';

interface Props {
  user: User;
  demoMode: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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

function dotColor(tone: string) {
  const k = tone.toLowerCase();
  return TONE_COLORS[k] || TONE_COLORS.default;
}

const DEMO_SCHEDULED = [
  {
    _id: 'ds1',
    tone: 'Builder',
    angle: 'Week review',
    content: 'I shipped 3 features this week while keeping my day job...',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    status: 'scheduled',
  },
  {
    _id: 'ds2',
    tone: 'Insight',
    angle: 'LinkedIn hooks',
    content: 'Most LinkedIn posts fail for one reason...',
    scheduledDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    status: 'scheduled',
  },
];

const s: Record<string, CSSProperties> = {
  root: {
    padding: 24,
    display: 'flex',
    gap: 20,
    height: '100%',
    animation: 'fadeIn .2s ease',
  },
  calendarSection: {
    flex: '0 0 600px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthLabel: {
    fontFamily: 'var(--head)',
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--t1)',
  },
  navBtns: {
    display: 'flex',
    gap: 6,
  },
  navBtn: {
    padding: '6px 12px',
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    color: 'var(--t2)',
    fontFamily: 'var(--head)',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all .15s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 2,
  },
  dayHeader: {
    padding: '8px 4px',
    textAlign: 'center' as const,
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--t3)',
    letterSpacing: '.8px',
    fontFamily: 'var(--head)',
  },
  day: (isToday: boolean, isSelected: boolean, isCurrentMonth: boolean): CSSProperties => ({
    minHeight: 68,
    padding: '6px',
    background: isSelected ? 'rgba(107,79,255,.15)' : isToday ? 'rgba(107,79,255,.06)' : 'var(--s1)',
    border: isSelected ? '1px solid rgba(107,79,255,.4)' : isToday ? '1px solid rgba(107,79,255,.2)' : '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    cursor: 'pointer',
    transition: 'all .15s',
    opacity: isCurrentMonth ? 1 : 0.35,
  }),
  dayNum: (isToday: boolean): CSSProperties => ({
    fontSize: 12,
    fontWeight: isToday ? 700 : 500,
    color: isToday ? 'var(--ac2)' : 'var(--t2)',
    marginBottom: 4,
    fontFamily: 'var(--head)',
  }),
  dots: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 3,
  },
  dot: (color: string): CSSProperties => ({
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }),
  sidePanel: {
    flex: 1,
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r2)',
    padding: 20,
    overflowY: 'auto' as const,
    maxHeight: 'calc(100vh - 120px)',
  },
  sidePanelTitle: {
    fontFamily: 'var(--head)',
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--t1)',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: '1px solid var(--bd)',
  },
  postCard: {
    background: 'var(--s2)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    padding: 14,
    marginBottom: 10,
  },
  postTone: (tone: string): CSSProperties => ({
    fontSize: 10,
    fontWeight: 700,
    color: dotColor(tone),
    textTransform: 'uppercase' as const,
    letterSpacing: '.5px',
    marginBottom: 6,
  }),
  postContent: {
    fontSize: 13,
    color: 'var(--t2)',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    marginBottom: 10,
  },
  postActions: {
    display: 'flex',
    gap: 6,
  },
  smallBtn: {
    flex: 1,
    padding: '5px 0',
    background: 'var(--s3)',
    border: '1px solid var(--bd)',
    borderRadius: 6,
    color: 'var(--t3)',
    fontFamily: 'var(--head)',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all .15s',
  },
  emptyPanel: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: 'var(--t3)',
    fontSize: 13,
  },
};

export default function CalendarView({ user, demoMode }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const scheduledPosts = useQuery(
    api.posts.getPosts,
    !demoMode ? { userId: user._id as any, status: 'scheduled' as const } : 'skip'
  );

  const posts = demoMode ? DEMO_SCHEDULED : (scheduledPosts ?? []);
  const setStatus = useMutation(api.posts.setStatus);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const postsByDate: Record<string, typeof posts> = {};
  posts.forEach(p => {
    if (p.scheduledDate) {
      if (!postsByDate[p.scheduledDate]) postsByDate[p.scheduledDate] = [];
      postsByDate[p.scheduledDate].push(p);
    }
  });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const todayStr = today.toISOString().slice(0, 10);
  const selectedPosts = selectedDate ? (postsByDate[selectedDate] ?? []) : [];

  const handleUnschedule = async (postId: string) => {
    if (demoMode) return;
    await setStatus({ postId: postId as any, status: 'active' });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Build calendar cells
  const cells: { dateStr: string | null; dayNum: number; isCurrentMonth: boolean }[] = [];

  // prev month tail
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonthNum = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    cells.push({
      dateStr: `${prevYear}-${String(prevMonthNum + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  // next month head
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonthNum = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    cells.push({
      dateStr: `${nextYear}-${String(nextMonthNum + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  return (
    <div style={s.root}>
      <div style={s.calendarSection}>
        <div style={s.header}>
          <span style={s.monthLabel}>{MONTHS[month]} {year}</span>
          <div style={s.navBtns}>
            <button
              style={s.navBtn}
              onClick={prevMonth}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--bd2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
            >
              ←
            </button>
            <button
              style={s.navBtn}
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--bd2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
            >
              Today
            </button>
            <button
              style={s.navBtn}
              onClick={nextMonth}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--bd2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
            >
              →
            </button>
          </div>
        </div>

        <div style={s.grid}>
          {DAYS.map(d => (
            <div key={d} style={s.dayHeader}>{d}</div>
          ))}

          {cells.map((cell, i) => {
            const dayPosts = cell.dateStr ? (postsByDate[cell.dateStr] ?? []) : [];
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDate;
            return (
              <div
                key={i}
                style={s.day(isToday, isSelected, cell.isCurrentMonth)}
                onClick={() => setSelectedDate(cell.dateStr === selectedDate ? null : cell.dateStr)}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--bd2)';
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = isToday ? 'rgba(107,79,255,.2)' : 'var(--bd)';
                  }
                }}
              >
                <div style={s.dayNum(isToday)}>{cell.dayNum}</div>
                {dayPosts.length > 0 && (
                  <div style={s.dots}>
                    {dayPosts.slice(0, 6).map((p, pi) => (
                      <div key={pi} style={s.dot(dotColor(p.tone))} title={p.tone} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={s.sidePanel}>
        <div style={s.sidePanelTitle}>
          {selectedDate
            ? `Posts for ${selectedDate}`
            : `All scheduled — ${posts.length} post${posts.length !== 1 ? 's' : ''}`
          }
        </div>

        {selectedDate && selectedPosts.length === 0 && (
          <div style={s.emptyPanel}>No posts scheduled for this day.</div>
        )}

        {(selectedDate ? selectedPosts : posts).map(post => (
          <div key={post._id} style={s.postCard}>
            <div style={s.postTone(post.tone)}>{post.tone}</div>
            <div style={s.postContent}>{post.content}</div>
            <div style={s.postActions}>
              <button
                style={s.smallBtn}
                onClick={() => handleCopy(post.content)}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--t2)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}
              >
                Copy
              </button>
              <button
                style={{ ...s.smallBtn }}
                onClick={() => handleUnschedule(post._id)}
                disabled={demoMode}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--err)';
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--t3)';
                  e.currentTarget.style.borderColor = 'var(--bd)';
                }}
              >
                Unschedule
              </button>
            </div>
          </div>
        ))}

        {!selectedDate && posts.length === 0 && (
          <div style={s.emptyPanel}>
            No scheduled posts. Schedule posts from the Posts tab.
          </div>
        )}
      </div>
    </div>
  );
}
