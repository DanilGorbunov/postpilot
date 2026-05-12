import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { type User } from '../lib/auth';

interface Prefs {
  apikey?: string;
}

interface Props {
  user: User;
  prefs: Prefs | null;
  demoMode: boolean;
}

const DEMO_NEWS = [
  {
    _id: 'dn1',
    topic: 'AI',
    headline: 'Anthropic releases Claude 4 with extended context window',
    content: 'Anthropic has released Claude 4, featuring a 500k token context window and improved reasoning capabilities. This marks a significant leap forward in AI assistant capabilities...',
    imageUrl: undefined,
    savedToPost: false,
  },
  {
    _id: 'dn2',
    topic: 'LinkedIn',
    headline: 'LinkedIn adds AI-powered post suggestions for creators',
    content: 'LinkedIn is rolling out AI-powered content suggestions to help creators post more consistently. The feature analyzes engagement patterns and recommends topics...',
    imageUrl: undefined,
    savedToPost: false,
  },
  {
    _id: 'dn3',
    topic: 'Startups',
    headline: 'Y Combinator opens applications for Winter 2026 batch',
    content: 'Y Combinator has opened applications for its Winter 2026 batch. The program offers $500k in funding for 7% equity and has backed companies like Airbnb, Stripe, and Dropbox...',
    imageUrl: undefined,
    savedToPost: true,
  },
];

const TOPICS = ['AI', 'LinkedIn', 'Startups', 'Tech', 'Marketing', 'Productivity'];

const s: Record<string, CSSProperties> = {
  root: {
    padding: 24,
    animation: 'fadeIn .2s ease',
  },
  addRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    maxWidth: 700,
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    color: 'var(--t1)',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'var(--head)',
    transition: 'border-color .15s',
  },
  select: {
    padding: '10px 14px',
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    color: 'var(--t2)',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'var(--head)',
    cursor: 'pointer',
  },
  addBtn: {
    padding: '10px 18px',
    background: 'var(--ac)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--r)',
    fontFamily: 'var(--head)',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all .15s',
    flexShrink: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxWidth: 700,
  },
  card: {
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r2)',
    padding: 18,
    transition: 'border-color .15s',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  topicBadge: {
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 700,
    background: 'rgba(107,79,255,.15)',
    color: 'var(--ac2)',
    letterSpacing: '.5px',
    textTransform: 'uppercase' as const,
    flexShrink: 0,
  },
  savedBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--ok)',
    background: 'var(--ok2)',
    padding: '3px 10px',
    borderRadius: 12,
    flexShrink: 0,
  },
  headline: {
    fontFamily: 'var(--head)',
    fontSize: 14.5,
    fontWeight: 700,
    color: 'var(--t1)',
    lineHeight: 1.4,
    marginBottom: 8,
  },
  content: {
    fontSize: 13,
    color: 'var(--t2)',
    lineHeight: 1.6,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    marginBottom: 12,
  },
  actions: {
    display: 'flex',
    gap: 6,
  },
  actionBtn: {
    padding: '6px 14px',
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
  saveBtn: {
    padding: '6px 14px',
    background: 'rgba(107,79,255,.12)',
    border: '1px solid rgba(107,79,255,.3)',
    borderRadius: 6,
    color: 'var(--ac2)',
    fontFamily: 'var(--head)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all .15s',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: 'var(--t3)',
    fontSize: 14,
    maxWidth: 700,
  },
  emptyIcon: {
    fontSize: 36,
    opacity: 0.3,
    marginBottom: 14,
    display: 'block',
  },
};

export default function NewsView({ user, prefs, demoMode }: Props) {
  const [newHeadline, setNewHeadline] = useState('');
  const [newTopic, setNewTopic] = useState('AI');
  const [newContent, setNewContent] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);

  const rawNews = useQuery(
    api.news.getNews,
    !demoMode ? { userId: user._id as any } : 'skip'
  );

  const newsPosts = demoMode ? DEMO_NEWS : (rawNews ?? []);
  const createNewsPost = useMutation(api.news.createNewsPost);
  const saveNewsAsPost = useMutation(api.news.saveNewsAsPost);

  const handleAdd = async () => {
    if (!newHeadline.trim() || demoMode) return;
    setAdding(true);
    try {
      await createNewsPost({
        userId: user._id as any,
        topic: newTopic,
        headline: newHeadline.trim(),
        content: newContent.trim() || newHeadline.trim(),
      });
      setNewHeadline('');
      setNewContent('');
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  };

  const handleSaveAsPost = async (newsId: string) => {
    if (demoMode) return;
    await saveNewsAsPost({ newsId: newsId as any, userId: user._id as any });
  };

  return (
    <div style={s.root}>
      <div style={{ marginBottom: 16, maxWidth: 700 }}>
        <button
          style={{
            padding: '9px 18px',
            background: showForm ? 'var(--s2)' : 'var(--ac)',
            color: showForm ? 'var(--t2)' : '#fff',
            border: showForm ? '1px solid var(--bd)' : 'none',
            borderRadius: 'var(--r)',
            fontFamily: 'var(--head)',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all .15s',
          }}
          onClick={() => setShowForm(f => !f)}
        >
          {showForm ? 'Cancel' : '+ Add News Item'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 'var(--r2)', padding: 18, marginBottom: 20, maxWidth: 700, animation: 'fadeIn .2s ease' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              style={{ ...s.input, flex: 1 }}
              type="text"
              placeholder="Headline..."
              value={newHeadline}
              onChange={e => setNewHeadline(e.target.value)}
              onFocus={e => (e.target.style.borderColor = 'var(--ac)')}
              onBlur={e => (e.target.style.borderColor = 'var(--bd)')}
            />
            <select
              style={s.select}
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
            >
              {TOPICS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <textarea
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'var(--s2)',
              border: '1px solid var(--bd)',
              borderRadius: 'var(--r)',
              color: 'var(--t1)',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'var(--head)',
              resize: 'vertical' as const,
              minHeight: 80,
              marginBottom: 10,
            }}
            placeholder="Content or summary..."
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'var(--ac)')}
            onBlur={e => (e.target.style.borderColor = 'var(--bd)')}
          />
          <button
            style={{ ...s.addBtn, opacity: adding || !newHeadline ? 0.7 : 1 }}
            onClick={handleAdd}
            disabled={adding || !newHeadline.trim()}
            onMouseEnter={e => { if (!adding) e.currentTarget.style.background = 'var(--ac2)'; }}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--ac)')}
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
      )}

      <div style={s.list}>
        {newsPosts.length === 0 && (
          <div style={s.empty}>
            <span style={s.emptyIcon}>◎</span>
            No news items yet. Add items to track and turn into posts.
          </div>
        )}

        {newsPosts.map(item => (
          <div
            key={item._id}
            style={s.card}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(107,79,255,.25)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
          >
            <div style={s.cardHeader}>
              <span style={s.topicBadge}>{item.topic}</span>
              {item.savedToPost && <span style={s.savedBadge}>✓ Saved as post</span>}
            </div>
            <div style={s.headline}>{item.headline}</div>
            <div style={s.content}>{item.content}</div>
            <div style={s.actions}>
              <button
                style={s.actionBtn}
                onClick={() => navigator.clipboard.writeText(item.content)}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.background = 'var(--s3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'var(--s2)'; }}
              >
                Copy
              </button>
              {!item.savedToPost && (
                <button
                  style={s.saveBtn}
                  onClick={() => handleSaveAsPost(item._id)}
                  disabled={demoMode}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(107,79,255,.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(107,79,255,.12)')}
                >
                  Save as post →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
