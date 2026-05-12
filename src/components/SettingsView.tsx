import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { type User } from '../lib/auth';

interface Props {
  user: User;
  prefs: any;
  demoMode: boolean;
}

const TONES = ['Professional', 'Storytelling', 'Educational', 'Motivational', 'Conversational', 'Provocative'];
const LANGUAGES = [
  { code: 'English', label: 'EN' },
  { code: 'Ukrainian', label: 'UK' },
  { code: 'German', label: 'DE' },
  { code: 'French', label: 'FR' },
  { code: 'Spanish', label: 'ES' },
];

function settingsChipStyle(active: boolean): CSSProperties {
  return { padding: '5px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: active ? '1px solid var(--ac)' : '1px solid var(--bd)', background: active ? 'rgba(107,79,255,.15)' : 'var(--s2)', color: active ? 'var(--ac2)' : 'var(--t2)', transition: 'all .15s', fontFamily: 'var(--head)' };
}

const s: Record<string, CSSProperties> = {
  root: {
    padding: 24,
    maxWidth: 640,
    animation: 'fadeIn .2s ease',
  },
  section: {
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r2)',
    padding: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'var(--head)',
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--t1)',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid var(--bd)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 16,
  },
  row: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--t2)',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--s2)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    color: 'var(--t1)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color .15s',
    fontFamily: 'var(--head)',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--s2)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    color: 'var(--t1)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color .15s',
    resize: 'vertical' as const,
    minHeight: 80,
    fontFamily: 'var(--head)',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 4,
  },
  langChips: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap' as const,
  },
  saveBtn: {
    padding: '11px 28px',
    background: 'var(--ac)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--r)',
    fontFamily: 'var(--head)',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all .15s',
  },
  savedMsg: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: 'var(--ok)',
    fontWeight: 500,
  },
  apiKeyNote: {
    fontSize: 12,
    color: 'var(--t3)',
    marginTop: 6,
    lineHeight: 1.5,
  },
  dangerSection: {
    background: 'rgba(239,68,68,.04)',
    border: '1px solid rgba(239,68,68,.15)',
    borderRadius: 'var(--r2)',
    padding: 20,
    marginTop: 8,
  },
  dangerTitle: {
    fontFamily: 'var(--head)',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--err)',
    marginBottom: 8,
  },
  dangerText: {
    fontSize: 13,
    color: 'var(--t3)',
    marginBottom: 12,
    lineHeight: 1.5,
  },
};

export default function SettingsView({ user, prefs: initialPrefs, demoMode }: Props) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [projects, setProjects] = useState('');
  const [stack, setStack] = useState('');
  const [audience, setAudience] = useState('');
  const [selectedTones, setSelectedTones] = useState<string[]>([]);
  const [lang, setLang] = useState('English');
  const [avoid, setAvoid] = useState('');
  const [apikey, setApikey] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [site, setSite] = useState('');

  const livePrefs = useQuery(
    api.users.getPrefs,
    !demoMode ? { userId: user._id as any } : 'skip'
  );

  const prefs = livePrefs ?? initialPrefs;

  useEffect(() => {
    if (prefs) {
      setName(prefs.name || user.name || '');
      setRole(prefs.role || '');
      setLocation(prefs.location || '');
      setBio(prefs.bio || '');
      setProjects(prefs.projects || '');
      setStack(prefs.stack || '');
      setAudience(prefs.audience || '');
      setSelectedTones(prefs.tone ? prefs.tone.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
      setLang(prefs.lang || 'English');
      setAvoid(prefs.avoid || '');
      setApikey(prefs.apikey || '');
      setLinkedin(prefs.linkedin || '');
      setSite(prefs.site || '');
    } else {
      setName(user.name || '');
    }
  }, [prefs]);

  const upsertPrefs = useMutation(api.users.upsertPrefs);

  const toggleTone = (tone: string) => {
    setSelectedTones(prev =>
      prev.includes(tone) ? prev.filter(t => t !== tone) : [...prev, tone]
    );
  };

  const handleSave = async () => {
    if (demoMode) return;
    setSaving(true);
    try {
      await upsertPrefs({
        userId: user._id as any,
        name: name || user.name,
        role: role || undefined,
        location: location || undefined,
        bio: bio || undefined,
        projects: projects || undefined,
        stack: stack || undefined,
        audience: audience || undefined,
        tone: selectedTones.join(', ') || undefined,
        lang: lang || undefined,
        avoid: avoid || undefined,
        apikey: apikey || undefined,
        linkedin: linkedin || undefined,
        site: site || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--ac)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--bd)';
  };

  return (
    <form style={s.root} onSubmit={e => { e.preventDefault(); handleSave(); }}>
      {/* Profile */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <span style={s.sectionIcon}>◉</span> Profile
        </div>

        <div style={s.row}>
          <label style={s.label}>Full name</label>
          <input style={s.input} type="text" value={name} onChange={e => setName(e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
        <div style={s.row}>
          <label style={s.label}>Role / Title</label>
          <input style={s.input} type="text" placeholder="e.g. Indie Founder, Senior Engineer" value={role} onChange={e => setRole(e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
        <div style={s.row}>
          <label style={s.label}>Location</label>
          <input style={s.input} type="text" placeholder="e.g. Remote, San Francisco" value={location} onChange={e => setLocation(e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
        <div style={s.row}>
          <label style={s.label}>Bio</label>
          <textarea style={s.textarea} placeholder="Who you are..." value={bio} onChange={e => setBio(e.target.value)} onFocus={focusStyle as any} onBlur={blurStyle as any} />
        </div>
      </div>

      {/* Work context */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <span style={s.sectionIcon}>◈</span> Work context
        </div>

        <div style={s.row}>
          <label style={s.label}>Projects / Products</label>
          <input style={s.input} type="text" placeholder="What you're building..." value={projects} onChange={e => setProjects(e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
        <div style={s.row}>
          <label style={s.label}>Tech stack / Expertise</label>
          <input style={s.input} type="text" placeholder="e.g. React, TypeScript, Rust" value={stack} onChange={e => setStack(e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
      </div>

      {/* Content strategy */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <span style={s.sectionIcon}>✦</span> Content strategy
        </div>

        <div style={s.row}>
          <label style={s.label}>Target audience</label>
          <input style={s.input} type="text" placeholder="Who reads your posts..." value={audience} onChange={e => setAudience(e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
        <div style={s.row}>
          <label style={s.label}>Preferred tones</label>
          <div style={s.chips}>
            {TONES.map(tone => (
              <button key={tone} style={settingsChipStyle(selectedTones.includes(tone))} onClick={() => toggleTone(tone)} type="button">
                {tone}
              </button>
            ))}
          </div>
        </div>
        <div style={s.row}>
          <label style={s.label}>Post language</label>
          <div style={s.langChips}>
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                style={settingsChipStyle(lang === l.code)}
                onClick={() => setLang(l.code)}
                type="button"
              >
                {l.label} — {l.code}
              </button>
            ))}
          </div>
        </div>
        <div style={s.row}>
          <label style={s.label}>Topics / phrases to avoid</label>
          <input style={s.input} type="text" placeholder="e.g. politics, competitors" value={avoid} onChange={e => setAvoid(e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
      </div>

      {/* Integrations */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <span style={s.sectionIcon}>⊞</span> Integrations
        </div>

        <div style={s.row}>
          <label style={s.label}>Anthropic API key</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...s.input, flex: 1, fontFamily: apikey ? 'var(--mono)' : 'var(--head)', fontSize: apikey ? 12 : 14 }}
              type={showApiKey ? 'text' : 'password'}
              placeholder="sk-ant-api03-..."
              value={apikey}
              onChange={e => setApikey(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <button
              style={{
                padding: '10px 14px',
                background: 'var(--s2)',
                border: '1px solid var(--bd)',
                borderRadius: 'var(--r)',
                color: 'var(--t3)',
                fontFamily: 'var(--head)',
                fontSize: 12,
                cursor: 'pointer',
                flexShrink: 0,
              }}
              type="button"
              onClick={() => setShowApiKey(s => !s)}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p style={s.apiKeyNote}>
            Used to call Claude API for post generation. Get a key at console.anthropic.com
          </p>
        </div>
        <div style={s.row}>
          <label style={s.label}>LinkedIn profile URL</label>
          <input style={s.input} type="url" placeholder="https://linkedin.com/in/..." value={linkedin} onChange={e => setLinkedin(e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
        <div style={s.row}>
          <label style={s.label}>Website / Portfolio</label>
          <input style={s.input} type="url" placeholder="https://yoursite.com" value={site} onChange={e => setSite(e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
        </div>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          type="submit"
          style={{ ...s.saveBtn, opacity: saving || demoMode ? 0.7 : 1 }}
          disabled={saving || demoMode}
          onMouseEnter={e => { if (!saving && !demoMode) e.currentTarget.style.background = 'var(--ac2)'; }}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--ac)')}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && (
          <span style={s.savedMsg}>
            ✓ Settings saved
          </span>
        )}
        {demoMode && (
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>Sign in to save settings</span>
        )}
      </div>

      {/* Account info */}
      <div style={{ ...s.section, marginTop: 24 }}>
        <div style={s.sectionTitle}>Account</div>
        <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 4 }}>
          <strong style={{ color: 'var(--t1)' }}>Name:</strong> {user.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--t2)' }}>
          <strong style={{ color: 'var(--t1)' }}>Email:</strong> {user.email}
        </div>
      </div>
    </form>
  );
}
