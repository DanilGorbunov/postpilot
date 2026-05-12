import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { type User } from '../lib/auth';

interface Props {
  user: User;
  onDone: (hasApiKey: boolean) => void;
  onBack: () => void;
}

const TONES = ['Professional', 'Storytelling', 'Educational', 'Motivational', 'Conversational', 'Provocative'];
const LANGUAGES = [
  { code: 'English', label: 'EN' },
  { code: 'Ukrainian', label: 'UK' },
  { code: 'German', label: 'DE' },
  { code: 'French', label: 'FR' },
  { code: 'Spanish', label: 'ES' },
];

const s: Record<string, CSSProperties | ((...args: any[]) => CSSProperties)> = {
  root: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r2)',
    padding: 40,
    width: '100%',
    maxWidth: 520,
    animation: 'fadeIn .25s ease',
  },
  header: {
    marginBottom: 32,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--ac2)',
    letterSpacing: '1.2px',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'var(--head)',
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--t1)',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--t3)',
  },
  dots: {
    display: 'flex',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 28,
  },
  dot: (active: boolean, done: boolean): CSSProperties => ({
    width: active ? 20 : 8,
    height: 8,
    borderRadius: 4,
    background: done || active ? 'var(--ac)' : 'var(--s3)',
    transition: 'all .3s ease',
  }),
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--t2)',
    marginBottom: 6,
    marginTop: 14,
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
    minHeight: 90,
    fontFamily: 'var(--head)',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 8,
  },
  chip: (active: boolean): CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: active ? '1px solid var(--ac)' : '1px solid var(--bd)',
    background: active ? 'rgba(107,79,255,.15)' : 'var(--s2)',
    color: active ? 'var(--ac2)' : 'var(--t2)',
    transition: 'all .15s',
  }),
  langChips: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap' as const,
  },
  langChip: (active: boolean): CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 'var(--r)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: active ? '1px solid var(--ac)' : '1px solid var(--bd)',
    background: active ? 'rgba(107,79,255,.15)' : 'var(--s2)',
    color: active ? 'var(--ac2)' : 'var(--t2)',
    transition: 'all .15s',
  }),
  btns: {
    display: 'flex',
    gap: 10,
    marginTop: 32,
  },
  backBtn: {
    flex: '0 0 auto',
    padding: '12px 22px',
    background: 'none',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    color: 'var(--t2)',
    fontFamily: 'var(--head)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all .15s',
  },
  nextBtn: {
    flex: 1,
    padding: '12px',
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
  keyNote: {
    fontSize: 12,
    color: 'var(--t3)',
    marginTop: 8,
    lineHeight: 1.5,
  },
  skipBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--t3)',
    fontSize: 13,
    cursor: 'pointer',
    padding: '12px 0',
    textDecoration: 'underline',
    fontFamily: 'var(--head)',
  },
  apiKeyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  apiKeyInput: {
    flex: 1,
    padding: '10px 14px',
    background: 'var(--s2)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r)',
    color: 'var(--t1)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color .15s',
    fontFamily: 'var(--mono)',
  },
};

const steps = [
  { label: 'Step 1 of 4', title: 'Who are you?', subtitle: 'Tell us about yourself' },
  { label: 'Step 2 of 4', title: 'Your work', subtitle: 'Help AI understand your context' },
  { label: 'Step 3 of 4', title: 'Content style', subtitle: 'Define your content strategy' },
  { label: 'Step 4 of 4', title: 'Connect & generate', subtitle: 'Add your API key to start generating' },
];

export default function OnboardingView({ user, onDone, onBack }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user.name || '');
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

  const upsertPrefs = useMutation(api.users.upsertPrefs);

  const toggleTone = (tone: string) => {
    setSelectedTones(prev =>
      prev.includes(tone) ? prev.filter(t => t !== tone) : [...prev, tone]
    );
  };

  const handleDone = async () => {
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
    } catch {
      // continue even if prefs save fails
    } finally {
      setSaving(false);
      onDone(!!apikey?.startsWith('sk-'));
    }
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--ac)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--bd)';
  };

  return (
    <div style={s.root}>
      <div style={s.card}>
        {step === 0 && (
          <button
            style={s.backBtn}
            onClick={onBack}
            type="button"
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--t2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}
          >
            ← Back to home
          </button>
        )}
        <div style={s.dots}>
          {steps.map((_, i) => (
            <div key={i} style={s.dot(i === step, i < step)} />
          ))}
        </div>

        <div style={s.header}>
          <div style={s.stepLabel}>{steps[step].label}</div>
          <div style={s.title}>{steps[step].title}</div>
          <div style={s.subtitle}>{steps[step].subtitle}</div>
        </div>

        {step === 0 && (
          <div>
            <label style={s.label}>Full name *</label>
            <input
              style={s.input}
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <label style={s.label}>Your role / title</label>
            <input
              style={s.input}
              type="text"
              placeholder="e.g. Indie founder, Senior Engineer"
              value={role}
              onChange={e => setRole(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <label style={s.label}>Location</label>
            <input
              style={s.input}
              type="text"
              placeholder="e.g. San Francisco, Remote"
              value={location}
              onChange={e => setLocation(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <label style={s.label}>Bio / About you</label>
            <textarea
              style={s.textarea}
              placeholder="A short description of who you are and what you do..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              onFocus={focusStyle as any}
              onBlur={blurStyle as any}
            />
            <label style={s.label}>Projects / Products</label>
            <input
              style={s.input}
              type="text"
              placeholder="e.g. PostPilot, open-source CLI tool"
              value={projects}
              onChange={e => setProjects(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <label style={s.label}>Tech stack / Expertise</label>
            <input
              style={s.input}
              type="text"
              placeholder="e.g. React, TypeScript, Python, AI/ML"
              value={stack}
              onChange={e => setStack(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <label style={s.label}>Target audience</label>
            <input
              style={s.input}
              type="text"
              placeholder="e.g. Startup founders, software engineers"
              value={audience}
              onChange={e => setAudience(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <label style={{ ...s.label, marginTop: 18 }}>Preferred tones (pick any)</label>
            <div style={s.chips}>
              {TONES.map(tone => (
                <button
                  key={tone}
                  style={s.chip(selectedTones.includes(tone))}
                  onClick={() => toggleTone(tone)}
                  type="button"
                >
                  {tone}
                </button>
              ))}
            </div>
            <label style={{ ...s.label, marginTop: 18 }}>Post language</label>
            <div style={s.langChips}>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  style={s.langChip(lang === l.code)}
                  onClick={() => setLang(l.code)}
                  type="button"
                >
                  {l.label}
                </button>
              ))}
            </div>
            <label style={{ ...s.label, marginTop: 18 }}>Topics / phrases to avoid</label>
            <input
              style={s.input}
              type="text"
              placeholder="e.g. politics, competitors, buzzwords"
              value={avoid}
              onChange={e => setAvoid(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <label style={s.label}>Anthropic API key</label>
            <div style={s.apiKeyRow}>
              <input
                style={s.apiKeyInput}
                type="password"
                placeholder="sk-ant-api03-..."
                value={apikey}
                onChange={e => setApikey(e.target.value)}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
            <p style={s.keyNote}>
              Your key is stored securely and only used to call Claude on your behalf.
              Get a key at <strong>console.anthropic.com</strong>
            </p>
            <label style={{ ...s.label, marginTop: 18 }}>LinkedIn profile URL</label>
            <input
              style={s.input}
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedin}
              onChange={e => setLinkedin(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <label style={{ ...s.label }}>Your website / portfolio</label>
            <input
              style={s.input}
              type="url"
              placeholder="https://yoursite.com"
              value={site}
              onChange={e => setSite(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
        )}

        <div style={s.btns}>
          {step > 0 ? (
            <button
              style={s.backBtn}
              onClick={() => setStep(s => s - 1)}
              type="button"
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--bd2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
            >
              Back
            </button>
          ) : null}

          {step < 3 ? (
            <button
              style={s.nextBtn}
              onClick={() => setStep(s => s + 1)}
              type="button"
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--ac2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--ac)')}
            >
              Next →
            </button>
          ) : (
            <button
              style={{ ...s.nextBtn, opacity: saving ? 0.7 : 1 }}
              onClick={handleDone}
              type="button"
              disabled={saving}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--ac2)'; }}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--ac)')}
            >
              {saving ? 'Saving...' : 'Done →'}
            </button>
          )}
        </div>

        {step === 3 && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button style={s.skipBtn} onClick={handleDone} type="button">
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
