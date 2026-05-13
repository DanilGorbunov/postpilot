import type { CSSProperties } from 'react';
import { useUILang } from '../lib/i18n';
import { useTheme } from '../lib/theme';

interface Props {
  onGetStarted: () => void;
  onDemo: () => void;
}

const s: Record<string, CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  orb1: {
    position: 'fixed',
    width: 700,
    height: 700,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(107,79,255,.28) 0%, transparent 70%)',
    filter: 'blur(120px)',
    top: -250,
    left: -150,
    pointerEvents: 'none',
    zIndex: 0,
  },
  orb2: {
    position: 'fixed',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,111,255,.18) 0%, transparent 70%)',
    filter: 'blur(100px)',
    bottom: -150,
    right: -80,
    pointerEvents: 'none',
    zIndex: 0,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 40px',
    borderBottom: '1px solid var(--bd)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    background: 'rgba(10,10,15,.75)',
  },
  logo: {
    fontFamily: 'var(--head)',
    fontSize: 20,
    fontWeight: 800,
    color: 'var(--t1)',
    letterSpacing: '-0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    background: 'var(--ac)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 14,
    color: '#fff',
  },
  logoAccent: {
    color: 'var(--ac2)',
  },
  navBtns: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  btnGhost: {
    fontFamily: 'var(--head)',
    fontSize: 13,
    fontWeight: 500,
    padding: '8px 18px',
    border: '1px solid var(--bd2)',
    color: 'var(--t2)',
    background: 'none',
    borderRadius: 20,
    cursor: 'pointer',
    transition: 'all .15s',
  },
  btnAc: {
    fontFamily: 'var(--head)',
    fontSize: 13,
    fontWeight: 700,
    padding: '8px 20px',
    background: 'var(--ac)',
    color: '#fff',
    border: 'none',
    borderRadius: 20,
    cursor: 'pointer',
    transition: 'all .15s',
    letterSpacing: '.2px',
  },
  inner: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
  },
  hero: {
    textAlign: 'center',
    padding: '100px 20px 80px',
    maxWidth: 860,
    margin: '0 auto',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--head)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '1.4px',
    textTransform: 'uppercase' as const,
    color: 'var(--ac2)',
    border: '1px solid rgba(139,111,255,.35)',
    background: 'rgba(107,79,255,.08)',
    padding: '6px 16px',
    borderRadius: 20,
    marginBottom: 28,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--ac)',
    display: 'inline-block',
  },
  h1: {
    fontFamily: 'var(--head)',
    fontSize: 'clamp(44px, 7vw, 80px)',
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: '-3px',
    marginBottom: 20,
    color: 'var(--t1)',
  },
  h1Accent: {
    background: 'linear-gradient(135deg, var(--ac) 0%, #a78bfa 50%, #c084fc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  sub: {
    fontFamily: 'var(--head)',
    fontSize: 17,
    fontWeight: 400,
    lineHeight: 1.75,
    color: 'var(--t2)',
    maxWidth: 520,
    margin: '0 auto 44px',
  },
  cta: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  btnHeroAc: {
    fontFamily: 'var(--head)',
    fontSize: 15,
    fontWeight: 700,
    padding: '14px 36px',
    borderRadius: 50,
    cursor: 'pointer',
    border: 'none',
    letterSpacing: '.2px',
    background: 'linear-gradient(135deg, var(--ac), var(--ac2))',
    color: '#fff',
    boxShadow: '0 4px 30px rgba(107,79,255,.45)',
    transition: 'all .2s',
  },
  btnHeroOut: {
    fontFamily: 'var(--head)',
    fontSize: 15,
    fontWeight: 600,
    padding: '14px 36px',
    borderRadius: 50,
    cursor: 'pointer',
    background: 'none',
    color: 'var(--t1)',
    border: '1.5px solid var(--bd2)',
    transition: 'all .2s',
  },
  statsRow: {
    display: 'flex',
    gap: 2,
    justifyContent: 'center',
    margin: '70px auto 0',
    maxWidth: 700,
    padding: '0 20px',
  },
  statBox: {
    flex: 1,
    textAlign: 'center' as const,
    padding: '24px 20px',
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r2)',
  },
  statNum: {
    fontFamily: 'var(--head)',
    fontSize: 32,
    fontWeight: 800,
    color: 'var(--ac2)',
    letterSpacing: '-1px',
    display: 'block',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'var(--head)',
    fontSize: 12,
    color: 'var(--t3)',
    fontWeight: 500,
  },
  features: {
    maxWidth: 1000,
    margin: '80px auto',
    padding: '0 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 16,
  },
  featureCard: {
    background: 'var(--s1)',
    border: '1px solid var(--bd)',
    borderRadius: 'var(--r2)',
    padding: 28,
    transition: 'border-color .2s',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 14,
    display: 'block',
  },
  featureTitle: {
    fontFamily: 'var(--head)',
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--t1)',
    marginBottom: 8,
  },
  featureDesc: {
    fontFamily: 'var(--head)',
    fontSize: 13,
    color: 'var(--t3)',
    lineHeight: 1.6,
  },
  footer: {
    borderTop: '1px solid var(--bd)',
    padding: '24px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  footerText: {
    fontSize: 13,
    color: 'var(--t3)',
  },
  footerBrand: {
    fontFamily: 'var(--head)',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--ac2)',
  },
};

const features = [
  {
    icon: '✦',
    title: 'AI-powered generation',
    desc: 'Claude generates authentic posts tailored to your voice, audience, and goals — not generic corporate speak.',
  },
  {
    icon: '◈',
    title: 'Smart scheduling',
    desc: 'Visual calendar with optimal posting times. Schedule weeks of content in minutes.',
  },
  {
    icon: '◎',
    title: 'Content intelligence',
    desc: 'Score your posts, get improvement feedback, and generate variants to find what resonates.',
  },
  {
    icon: '◆',
    title: 'Ideas capture',
    desc: 'Never lose a thought. Capture ideas and turn them into polished posts instantly.',
  },
  {
    icon: '◉',
    title: 'News to posts',
    desc: 'Transform trending topics into your unique take — automatically adapted to your brand.',
  },
  {
    icon: '⬡',
    title: 'Your API key',
    desc: 'Use your own Anthropic key. Full control, no markup, no limits on what you create.',
  },
];

function langBtnStyle(active: boolean): CSSProperties {
  return {
    background: active ? 'rgba(107,79,255,.15)' : 'none',
    border: active ? '1px solid rgba(107,79,255,.35)' : '1px solid transparent',
    color: active ? 'var(--ac2)' : 'var(--t3)',
    borderRadius: 6,
    padding: '3px 7px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--head)',
    transition: 'all .15s',
  };
}

export default function LandingView({ onGetStarted, onDemo }: Props) {
  const { lang, setLang } = useUILang();
  const { theme, toggle: toggleTheme } = useTheme();

  const navBg = theme === 'dark' ? 'rgba(10,10,15,.82)' : 'rgba(244,244,248,.88)';

  return (
    <div style={s.root}>
      <div style={s.orb1} />
      <div style={s.orb2} />

      <nav style={{ ...s.nav, background: navBg }}>
        <div style={s.logo}>
          <div style={s.logoIcon}>P</div>
          <span>Post<span style={s.logoAccent}>Pilot</span></span>
        </div>
        <div style={s.navBtns}>
          {/* Language toggle */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--s2)', borderRadius: 8, padding: 3, border: '1px solid var(--bd)' }}>
            <button style={langBtnStyle(lang === 'en')} onClick={() => setLang('en')}>EN</button>
            <button style={langBtnStyle(lang === 'uk')} onClick={() => setLang('uk')}>UK</button>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            style={{
              background: 'var(--s2)',
              border: '1px solid var(--bd)',
              borderRadius: 8,
              color: 'var(--t2)',
              cursor: 'pointer',
              fontSize: 14,
              padding: '5px 8px',
              lineHeight: 1,
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--s3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--s2)'; }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            style={s.btnGhost}
            onClick={onDemo}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.color = 'var(--t1)';
              (e.target as HTMLButtonElement).style.borderColor = 'var(--ac)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.color = 'var(--t2)';
              (e.target as HTMLButtonElement).style.borderColor = 'var(--bd2)';
            }}
          >
            Demo
          </button>
          <button
            style={s.btnAc}
            onClick={onGetStarted}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.background = 'var(--ac2)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.background = 'var(--ac)';
            }}
          >
            Sign In
          </button>
        </div>
      </nav>

      <div style={s.inner}>
        <div style={s.hero}>
          <div style={s.badge}>
            <span style={s.badgeDot} />
            AI-Powered LinkedIn Growth
          </div>

          <h1 style={s.h1}>
            Your LinkedIn<br />
            <span style={s.h1Accent}>content engine</span>
          </h1>

          <p style={s.sub}>
            Generate authentic, high-performing LinkedIn posts with AI.
            Schedule smarter. Grow faster. Stay consistent without the grind.
          </p>

          <div style={s.cta}>
            <button
              style={s.btnHeroAc}
              onClick={onGetStarted}
              onMouseEnter={e => {
                (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 8px 40px rgba(107,79,255,.55)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 4px 30px rgba(107,79,255,.45)';
              }}
            >
              Get Started — It's Free
            </button>
            <button
              style={s.btnHeroOut}
              onClick={onDemo}
              onMouseEnter={e => {
                (e.target as HTMLButtonElement).style.borderColor = 'var(--ac)';
                (e.target as HTMLButtonElement).style.color = 'var(--ac2)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.borderColor = 'var(--bd2)';
                (e.target as HTMLButtonElement).style.color = 'var(--t1)';
              }}
            >
              Try Demo
            </button>
          </div>
        </div>

        <div style={s.statsRow}>
          {[
            { num: '9+', label: 'Posts per generation' },
            { num: '5', label: 'Content tones' },
            { num: '∞', label: 'Variants & rewrites' },
          ].map(stat => (
            <div key={stat.label} style={s.statBox}>
              <span style={s.statNum}>{stat.num}</span>
              <span style={s.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>

        <div style={s.features}>
          {features.map(f => (
            <div
              key={f.title}
              style={s.featureCard}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(107,79,255,.35)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bd)';
              }}
            >
              <span style={s.featureIcon}>{f.icon}</span>
              <div style={s.featureTitle}>{f.title}</div>
              <div style={s.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <footer style={s.footer}>
        <span style={s.footerText}>Built for creators who think in public.</span>
        <span style={s.footerBrand}>PostPilot</span>
      </footer>
    </div>
  );
}
