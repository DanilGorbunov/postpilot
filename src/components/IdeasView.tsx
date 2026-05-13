import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { type User } from '../lib/auth';
import { useUILang } from '../lib/i18n';

interface Props {
  user: User;
  demoMode: boolean;
}

const DEMO_IDEAS = [
  { _id: 'di1', content: 'Write about the hardest decision I made this year as a founder', source: 'personal', used: false },
  { _id: 'di2', content: 'Share my productivity stack and what actually stuck after 6 months', source: 'personal', used: false },
  { _id: 'di3', content: 'Lessons from my first hire that I wish someone told me', source: 'personal', used: false },
  { _id: 'di4', content: 'The AI tools that actually save me hours each week', source: 'trend', used: false },
  { _id: 'di5', content: 'Why I stopped chasing virality and what happened', source: 'personal', used: true },
];

function ideaTabStyle(active: boolean): CSSProperties {
  return { padding: '5px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: active ? '1px solid var(--ac)' : '1px solid var(--bd)', background: active ? 'rgba(107,79,255,.15)' : 'var(--s1)', color: active ? 'var(--ac2)' : 'var(--t3)', transition: 'all .15s', fontFamily: 'var(--head)' };
}
function ideaCardStyle(used: boolean): CSSProperties {
  return { background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 'var(--r)', padding: '14px 16px', display: 'flex', alignItems: 'flex-start' as const, gap: 12, opacity: used ? 0.5 : 1, transition: 'all .15s' };
}

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
  },
  title: {
    fontFamily: 'var(--head)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--t2)',
  },
  addRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
  },
  addInput: {
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
  addBtn: {
    padding: '10px 20px',
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
  tabs: {
    display: 'flex',
    gap: 6,
    marginBottom: 16,
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    maxWidth: 700,
  },
  cardLeft: {
    flex: 1,
  },
  ideaText: {
    fontSize: 14,
    color: 'var(--t1)',
    lineHeight: 1.5,
    marginBottom: 6,
  },
  sourceBadge: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--t3)',
    background: 'var(--s3)',
    padding: '2px 8px',
    borderRadius: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: '.5px',
  },
  cardActions: {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
    alignItems: 'center',
  },
  usedBadge: {
    fontSize: 10,
    color: 'var(--ok)',
    fontWeight: 600,
    letterSpacing: '.5px',
    textTransform: 'uppercase' as const,
  },
  smallBtn: {
    padding: '5px 10px',
    background: 'var(--s2)',
    border: '1px solid var(--bd)',
    borderRadius: 6,
    color: 'var(--t3)',
    fontFamily: 'var(--head)',
    fontSize: 11,
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
};

export default function IdeasView({ user, demoMode }: Props) {
  const [filter, setFilter] = useState<'active' | 'used'>('active');
  const [newIdea, setNewIdea] = useState('');
  const [adding, setAdding] = useState(false);
  const { t } = useUILang();

  const rawIdeas = useQuery(
    api.ideas.getIdeas,
    !demoMode ? { userId: user._id as any } : 'skip'
  );

  const ideas = demoMode ? DEMO_IDEAS : (rawIdeas ?? []);
  const createIdea = useMutation(api.ideas.createIdea);
  const markUsed = useMutation(api.ideas.markIdeaUsed);

  const filtered = ideas.filter(i => filter === 'active' ? !i.used : i.used);

  const handleAdd = async () => {
    if (!newIdea.trim() || demoMode) return;
    setAdding(true);
    try {
      await createIdea({
        userId: user._id as any,
        content: newIdea.trim(),
        source: 'personal',
      });
      setNewIdea('');
    } finally {
      setAdding(false);
    }
  };

  const handleMarkUsed = async (ideaId: string) => {
    if (demoMode) return;
    await markUsed({ ideaId: ideaId as any });
  };

  return (
    <div style={s.root}>
      <div style={s.addRow}>
        <input
          style={s.addInput}
          type="text"
          placeholder={t('add_idea_placeholder')}
          value={newIdea}
          onChange={e => setNewIdea(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          onFocus={e => (e.target.style.borderColor = 'var(--ac)')}
          onBlur={e => (e.target.style.borderColor = 'var(--bd)')}
          disabled={demoMode}
        />
        <button
          style={{ ...s.addBtn, opacity: adding || demoMode ? 0.7 : 1 }}
          onClick={handleAdd}
          disabled={adding || demoMode}
          onMouseEnter={e => { if (!adding && !demoMode) e.currentTarget.style.background = 'var(--ac2)'; }}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--ac)')}
        >
          {t('add')}
        </button>
      </div>

      <div style={s.tabs}>
        <button style={ideaTabStyle(filter === 'active')} onClick={() => setFilter('active')}>
          Active ({ideas.filter(i => !i.used).length})
        </button>
        <button style={ideaTabStyle(filter === 'used')} onClick={() => setFilter('used')}>
          Used ({ideas.filter(i => i.used).length})
        </button>
      </div>

      <div style={s.list}>
        {filtered.length === 0 && (
          <div style={s.empty}>
            <span style={s.emptyIcon}>✦</span>
            {filter === 'active' ? t('no_ideas') : t('no_used_ideas')}
          </div>
        )}

        {filtered.map(idea => (
          <div
            key={idea._id}
            style={ideaCardStyle(idea.used)}
            onMouseEnter={e => { if (!idea.used) e.currentTarget.style.borderColor = 'var(--bd2)'; }}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
          >
            <div style={s.cardLeft}>
              <div style={s.ideaText}>{idea.content}</div>
              <span style={s.sourceBadge}>{idea.source}</span>
            </div>
            <div style={s.cardActions}>
              {idea.used ? (
                <span style={s.usedBadge}>{t('used')}</span>
              ) : (
                <button
                  style={s.smallBtn}
                  onClick={() => handleMarkUsed(idea._id)}
                  disabled={demoMode}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--ok)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--bd)'; }}
                >
                  {t('mark_used')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
