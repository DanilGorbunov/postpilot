import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
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

const TONES_FILTER = ['all', 'builder', 'insight', 'story', 'opinion', 'tactical'];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Get the Monday of the week containing `date` */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Add N days to a date */
function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Format as YYYY-MM-DD */
function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type Post = {
  _id: string;
  tone: string;
  angle: string;
  content: string;
  status: string;
  scheduledDate?: string;
  score?: number;
};

export default function PlannerView({ user, prefs, demoMode }: Props) {
  const [toneFilter, setToneFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedChip, setSelectedChip] = useState<Post | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiFilling, setAiFilling] = useState(false);

  const rawActive = useQuery(
    api.posts.getPosts,
    !demoMode ? { userId: user._id as any, status: 'active' as const } : 'skip'
  );
  const rawScheduled = useQuery(
    api.posts.getPosts,
    !demoMode ? { userId: user._id as any, status: 'scheduled' as const } : 'skip'
  );

  const setStatus = useMutation(api.posts.setStatus);
  const generatePostsAction = useAction(api.ai.generatePosts);
  const createManyPosts = useMutation(api.posts.createManyPosts);

  const activePosts: Post[] = demoMode ? [] : ((rawActive ?? []) as Post[]);
  const scheduledPosts: Post[] = demoMode ? [] : ((rawScheduled ?? []) as Post[]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Build 4-week grid: current Mon + 27 days
  const today = new Date();
  const weekStart = getMonday(today);
  const weeks: Date[][] = [];
  for (let w = 0; w < 4; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDays(weekStart, w * 7 + d));
    }
    weeks.push(week);
  }

  // Map scheduledDate → posts
  const scheduledByDate: Record<string, Post[]> = {};
  for (const post of scheduledPosts) {
    if (post.scheduledDate) {
      if (!scheduledByDate[post.scheduledDate]) scheduledByDate[post.scheduledDate] = [];
      scheduledByDate[post.scheduledDate].push(post);
    }
  }

  // Filtered active posts for left panel
  const filteredActive = activePosts.filter(p => {
    if (toneFilter !== 'all' && !p.tone.toLowerCase().includes(toneFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.content.toLowerCase().includes(q) || p.tone.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSchedulePost = async (postId: string, date: string) => {
    if (demoMode) return;
    await setStatus({ postId: postId as any, status: 'scheduled', scheduledDate: date });
    setSelectedDay(null);
  };

  const handleUnschedule = async (postId: string) => {
    if (demoMode) return;
    await setStatus({ postId: postId as any, status: 'active' });
    setSelectedChip(null);
  };

  const handleAiFillWeek = async () => {
    if (demoMode || aiFilling) return;
    const unscheduled = activePosts.filter(p =>
      !scheduledPosts.find(s => s._id === p._id)
    );
    const picks = unscheduled.slice(0, 3);
    if (picks.length === 0) {
      showToast('No unscheduled posts available');
      return;
    }
    setAiFilling(true);
    const slots = [toDateStr(weekStart), toDateStr(addDays(weekStart, 2)), toDateStr(addDays(weekStart, 4))];
    try {
      for (let i = 0; i < picks.length; i++) {
        await setStatus({ postId: picks[i]._id as any, status: 'scheduled', scheduledDate: slots[i] });
      }
      showToast(`Scheduled ${picks.length} post${picks.length > 1 ? 's' : ''} for Mon/Wed/Fri`);
    } catch (e) {
      showToast('Failed to schedule posts');
    }
    setAiFilling(false);
  };

  const handleGenerate = async () => {
    if (!prefs?.apikey?.startsWith('sk-ant') || demoMode) return;
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
      await createManyPosts({ userId: user._id as any, posts: generated });
      showToast(`Generated ${generated.length} new posts`);
    } catch (e) {
      showToast('Generation failed');
    }
    setGenerating(false);
  };

  // --- Styles ---
  const rootStyle: CSSProperties = {
    display: 'flex',
    height: 'calc(100vh - 57px)',
    overflow: 'hidden',
  };

  const leftPanel: CSSProperties = {
    width: '40%',
    flexShrink: 0,
    borderRight: '1px solid var(--bd)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const rightPanel: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: 20,
  };

  const panelHeader: CSSProperties = {
    padding: '16px 20px 12px',
    borderBottom: '1px solid var(--bd)',
    flexShrink: 0,
  };

  const panelTitle: CSSProperties = {
    fontFamily: 'var(--head)',
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--t1)',
    marginBottom: 10,
  };

  const searchInput: CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    background: 'var(--s2)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    color: 'var(--t1)',
    fontSize: 13,
    outline: 'none',
    marginBottom: 10,
    fontFamily: 'var(--head)',
  };

  const chipRowStyle: CSSProperties = {
    display: 'flex',
    gap: 5,
    flexWrap: 'wrap',
  };

  const toneChip = (active: boolean): CSSProperties => ({
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 11.5,
    fontWeight: 500,
    cursor: 'pointer',
    border: active ? '1px solid var(--ac)' : '1px solid var(--bd)',
    background: active ? 'rgba(107,79,255,.15)' : 'var(--s2)',
    color: active ? 'var(--ac2)' : 'var(--t3)',
    fontFamily: 'var(--head)',
    textTransform: 'capitalize',
  });

  const queueList: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const queueItem: CSSProperties = {
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  };

  const toneBadge = (tone: string): CSSProperties => ({
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
    background: `${toneColor(tone)}22`,
    color: toneColor(tone),
    border: `1px solid ${toneColor(tone)}44`,
    textTransform: 'uppercase',
    letterSpacing: '.3px',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  });

  const schedBtn: CSSProperties = {
    padding: '4px 10px',
    background: 'var(--ac)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
    fontFamily: 'var(--head)',
  };

  const calHeader: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  };

  const calGridStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  const dayColHeader: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '52px repeat(7, 1fr)',
    gap: 4,
    marginBottom: 6,
  };

  const weekRow: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '52px repeat(7, 1fr)',
    gap: 4,
  };

  const weekLabel: CSSProperties = {
    fontSize: 10,
    color: 'var(--t3)',
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'var(--mono)',
  };

  const dayCellBase = (isToday: boolean): CSSProperties => ({
    minHeight: 64,
    background: isToday ? 'rgba(107,79,255,.08)' : 'var(--s1)',
    border: `1px solid ${isToday ? 'rgba(107,79,255,.25)' : 'var(--bd)'}`,
    borderRadius: 6,
    padding: '4px 5px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    transition: 'border-color .15s',
  });

  const dayNum = (isToday: boolean): CSSProperties => ({
    fontSize: 11,
    fontWeight: isToday ? 700 : 500,
    color: isToday ? 'var(--ac2)' : 'var(--t3)',
    lineHeight: 1,
    marginBottom: 2,
  });

  const scheduledChip = (tone: string): CSSProperties => ({
    padding: '2px 5px',
    borderRadius: 4,
    fontSize: 9.5,
    fontWeight: 600,
    background: `${toneColor(tone)}22`,
    color: toneColor(tone),
    border: `1px solid ${toneColor(tone)}44`,
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  });

  const modalOverlay: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    backdropFilter: 'blur(4px)',
  };

  const modalCard: CSSProperties = {
    background: 'var(--s1)',
    border: '1px solid var(--bd2)',
    borderRadius: 'var(--r2)',
    padding: 24,
    width: 420,
    maxWidth: '95vw',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
  };

  const hasApiKey = prefs?.apikey?.startsWith('sk-ant');
  const isLoading = !demoMode && (rawActive === undefined || rawScheduled === undefined);

  if (demoMode) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>⊟</div>
        <div style={{ fontFamily: 'var(--head)', fontSize: 17, fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}>
          Planner not available in demo mode
        </div>
        <div style={{ fontSize: 14, color: 'var(--t3)' }}>Sign in to plan and schedule your content.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: 24, color: 'var(--t3)', fontSize: 14, textAlign: 'center' }}>
        Loading planner...
      </div>
    );
  }

  return (
    <div style={rootStyle}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'var(--s2)',
          border: '1px solid var(--bd2)',
          borderRadius: 'var(--r)',
          padding: '10px 18px',
          fontSize: 13,
          color: 'var(--t1)',
          zIndex: 300,
          boxShadow: '0 8px 24px rgba(0,0,0,.4)',
          fontFamily: 'var(--head)',
        }}>
          {toast}
        </div>
      )}

      {/* Left: Post Queue */}
      <div style={leftPanel}>
        <div style={panelHeader}>
          <div style={panelTitle}>Post Queue ({activePosts.length})</div>
          <input
            style={searchInput}
            placeholder="Search posts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'var(--ac)')}
            onBlur={e => (e.target.style.borderColor = 'var(--bd)')}
          />
          <div style={chipRowStyle}>
            {TONES_FILTER.map(t => (
              <button
                key={t}
                style={toneChip(toneFilter === t)}
                onClick={() => setToneFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={queueList}>
          {filteredActive.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 12 }}>
                {activePosts.length === 0 ? 'No posts in queue' : 'No posts match filter'}
              </div>
              {hasApiKey && (
                <button
                  style={{
                    padding: '8px 18px',
                    background: 'var(--ac)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--r)',
                    fontFamily: 'var(--head)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: generating ? 'not-allowed' : 'pointer',
                    opacity: generating ? 0.7 : 1,
                  }}
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? 'Generating...' : '✦ Generate Posts'}
                </button>
              )}
            </div>
          ) : (
            filteredActive.map(post => (
              <div
                key={post._id}
                style={queueItem}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(107,79,255,.25)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
              >
                <span style={toneBadge(post.tone)}>{post.tone}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {post.content.slice(0, 80)}{post.content.length > 80 ? '…' : ''}
                  </div>
                </div>
                <button
                  style={schedBtn}
                  onClick={() => setSelectedDay('__from_queue__' + post._id)}
                  title="Pick a day to schedule"
                >
                  + Schedule
                </button>
              </div>
            ))
          )}
        </div>

        {/* Generate more button at bottom of queue */}
        {activePosts.length > 0 && hasApiKey && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
            <button
              style={{
                width: '100%',
                padding: '8px 0',
                background: 'none',
                border: '1px solid var(--bd)',
                borderRadius: 'var(--r)',
                color: 'var(--t3)',
                fontFamily: 'var(--head)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: generating ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.6 : 1,
                transition: 'all .15s',
              }}
              onClick={handleGenerate}
              disabled={generating}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ac)'; e.currentTarget.style.color = 'var(--ac2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.color = 'var(--t3)'; }}
            >
              {generating ? 'Generating...' : '✦ Generate More'}
            </button>
          </div>
        )}
      </div>

      {/* Right: Content Calendar */}
      <div style={rightPanel}>
        <div style={calHeader}>
          <div style={{ fontFamily: 'var(--head)', fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
            Content Calendar
          </div>
          <button
            style={{
              padding: '7px 16px',
              background: aiFilling ? 'var(--s3)' : 'var(--ac)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--r)',
              fontFamily: 'var(--head)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: aiFilling ? 'not-allowed' : 'pointer',
              opacity: aiFilling ? 0.7 : 1,
            }}
            onClick={handleAiFillWeek}
            disabled={aiFilling}
            title="Auto-schedule 3 posts on Mon/Wed/Fri of current week"
          >
            {aiFilling ? 'Scheduling...' : '✦ AI Fill Week'}
          </button>
        </div>

        {/* Day column headers */}
        <div style={dayColHeader}>
          <div />
          {DAYS.map(d => (
            <div key={d} style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.5px' }}>
              {d}
            </div>
          ))}
        </div>

        <div style={calGridStyle}>
          {weeks.map((week, wi) => {
            return (
              <div key={wi} style={weekRow}>
                <div style={weekLabel}>
                  W{wi + 1}
                </div>
                {week.map(day => {
                  const dateStr = toDateStr(day);
                  const isToday = dateStr === toDateStr(today);
                  const dayPosts = scheduledByDate[dateStr] ?? [];
                  return (
                    <div
                      key={dateStr}
                      style={dayCellBase(isToday)}
                      onClick={() => setSelectedDay(dateStr)}
                      onMouseEnter={e => { if (!isToday) e.currentTarget.style.borderColor = 'rgba(107,79,255,.2)'; }}
                      onMouseLeave={e => { if (!isToday) e.currentTarget.style.borderColor = 'var(--bd)'; }}
                    >
                      <div style={dayNum(isToday)}>{day.getDate()}</div>
                      {dayPosts.map(p => (
                        <div
                          key={p._id}
                          style={scheduledChip(p.tone)}
                          onClick={e => { e.stopPropagation(); setSelectedChip(p); }}
                          title={p.content.slice(0, 80)}
                        >
                          {p.tone.slice(0, 1).toUpperCase()} {p.content.slice(0, 12)}…
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Schedule post picker (clicking empty day) */}
      {selectedDay && !selectedDay.startsWith('__from_queue__') && (
        <div style={modalOverlay} onClick={() => setSelectedDay(null)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--head)', fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
              Schedule for {selectedDay}
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 14 }}>
              Pick a post from your queue
            </div>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activePosts.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', padding: '20px 0' }}>
                  No posts in queue. Generate some posts first.
                </div>
              ) : activePosts.map(post => (
                <div
                  key={post._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    background: 'var(--s2)',
                    borderRadius: 'var(--r)',
                    border: '1px solid var(--bd)',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSchedulePost(post._id, selectedDay)}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(107,79,255,.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
                >
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
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}>
                    {post.tone}
                  </span>
                  <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>
                    {post.content.slice(0, 100)}{post.content.length > 100 ? '…' : ''}
                  </div>
                </div>
              ))}
            </div>
            <button
              style={{
                marginTop: 16,
                padding: '9px 0',
                background: 'none',
                border: '1px solid var(--bd)',
                borderRadius: 'var(--r)',
                color: 'var(--t3)',
                fontFamily: 'var(--head)',
                fontSize: 13,
                cursor: 'pointer',
              }}
              onClick={() => setSelectedDay(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Modal: Schedule from queue "+ Schedule" button */}
      {selectedDay && selectedDay.startsWith('__from_queue__') && (() => {
        const postId = selectedDay.replace('__from_queue__', '');
        const post = activePosts.find(p => p._id === postId);
        if (!post) return null;
        return (
          <div style={modalOverlay} onClick={() => setSelectedDay(null)}>
            <div style={{ ...modalCard, maxHeight: 'none' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontFamily: 'var(--head)', fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>
                Pick a date to schedule
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
                {weeks.flat().map(day => {
                  const dateStr = toDateStr(day);
                  const isToday = dateStr === toDateStr(today);
                  const slotPosts = scheduledByDate[dateStr] ?? [];
                  return (
                    <div
                      key={dateStr}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: isToday ? 'rgba(107,79,255,.08)' : 'var(--s2)',
                        borderRadius: 'var(--r)',
                        border: `1px solid ${isToday ? 'rgba(107,79,255,.2)' : 'var(--bd)'}`,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleSchedulePost(post._id, dateStr)}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(107,79,255,.3)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = isToday ? 'rgba(107,79,255,.2)' : 'var(--bd)')}
                    >
                      <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: isToday ? 600 : 400 }}>
                        {DAYS[day.getDay() === 0 ? 6 : day.getDay() - 1]} {dateStr}
                        {isToday && <span style={{ fontSize: 11, color: 'var(--ac2)', marginLeft: 6 }}>today</span>}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                        {slotPosts.length > 0 ? `${slotPosts.length} post${slotPosts.length > 1 ? 's' : ''}` : 'empty'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                style={{
                  marginTop: 14,
                  padding: '9px 0',
                  background: 'none',
                  border: '1px solid var(--bd)',
                  borderRadius: 'var(--r)',
                  color: 'var(--t3)',
                  fontFamily: 'var(--head)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedDay(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      })()}

      {/* Modal: Chip detail (scheduled post) */}
      {selectedChip && (
        <div style={modalOverlay} onClick={() => setSelectedChip(null)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{
                padding: '3px 10px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                background: `${toneColor(selectedChip.tone)}22`,
                color: toneColor(selectedChip.tone),
                border: `1px solid ${toneColor(selectedChip.tone)}44`,
                textTransform: 'uppercase',
                letterSpacing: '.3px',
              }}>
                {selectedChip.tone}
              </span>
              <span style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
                {selectedChip.scheduledDate}
              </span>
            </div>
            <div style={{
              fontSize: 13.5,
              color: 'var(--t2)',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              overflowY: 'auto',
              maxHeight: 300,
              padding: '10px 0',
              borderTop: '1px solid var(--bd)',
              borderBottom: '1px solid var(--bd)',
              marginBottom: 14,
            }}>
              {selectedChip.content}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: '1px solid rgba(239,68,68,.3)',
                  borderRadius: 'var(--r)',
                  color: 'var(--err)',
                  fontFamily: 'var(--head)',
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
                onClick={() => handleUnschedule(selectedChip._id)}
              >
                Unschedule
              </button>
              <button
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: '1px solid var(--bd)',
                  borderRadius: 'var(--r)',
                  color: 'var(--t2)',
                  fontFamily: 'var(--head)',
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedChip(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
