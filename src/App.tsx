import { useState, useEffect } from 'react';
import { getSession, type User } from './lib/auth';
import LandingView from './components/LandingView';
import AuthView from './components/AuthView';
import OnboardingView from './components/OnboardingView';
import AppLayout from './components/AppLayout';

export type View = 'landing' | 'auth' | 'onboarding' | 'app';
export type AppTab = 'posts' | 'schedule' | 'calendar' | 'news' | 'ideas' | 'settings';

function App() {
  const [view, setView] = useState<View>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<AppTab>('posts');
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      setView('app');
    }
  }, []);

  const handleAuthSuccess = (authUser: User, isNew: boolean) => {
    setUser(authUser);
    if (isNew) {
      setView('onboarding');
    } else {
      setView('app');
    }
  };

  const handleOnboardingDone = () => {
    setView('app');
  };

  const handleDemo = () => {
    const demoUser: User = {
      _id: 'demo_user',
      email: 'demo@postpilot.ai',
      name: 'Demo User',
      picture: undefined,
    };
    setUser(demoUser);
    setDemoMode(true);
    setView('app');
  };

  const handleLogout = () => {
    setUser(null);
    setDemoMode(false);
    setView('landing');
  };

  if (view === 'landing') {
    return (
      <LandingView
        onGetStarted={() => setView('auth')}
        onDemo={handleDemo}
      />
    );
  }

  if (view === 'auth') {
    return (
      <AuthView
        onBack={() => setView('landing')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (view === 'onboarding' && user) {
    return (
      <OnboardingView
        user={user}
        onDone={handleOnboardingDone}
      />
    );
  }

  if (view === 'app' && user) {
    return (
      <AppLayout
        user={user}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onLogout={handleLogout}
        demoMode={demoMode}
      />
    );
  }

  return null;
}

export default App;
