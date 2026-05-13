import { useState, useEffect, useCallback } from 'react';

export type UILang = 'en' | 'uk';

const STORAGE_KEY = 'pp_ui_lang';

const translations: Record<UILang, Record<string, string>> = {
  en: {
    // Nav labels
    posts: 'Posts',
    schedule: 'Schedule',
    planner: 'Planner',
    calendar: 'Calendar',
    news: 'News',
    ideas: 'Ideas',
    analytics: 'Analytics',
    settings: 'Settings',

    // Tab titles
    tab_posts: 'Posts',
    tab_schedule: 'Scheduled',
    tab_calendar: 'Calendar',
    tab_news: 'News',
    tab_ideas: 'Ideas',
    tab_settings: 'Settings',
    tab_analytics: 'Analytics',
    tab_planner: 'Content Planner',

    // Status pills
    ai_on: 'AI on',
    ai_off: 'AI off',
    li_linked: 'LI linked',
    li_unlinked: 'LI unlinked',

    // PostsView buttons & states
    generate_posts: '✦ Generate Posts',
    generating: 'Generating...',
    copy: 'Copy',
    copied: '✓ Copied',
    delete: '✕',
    schedule_post: 'Schedule',
    generate_18: '✦ Generate 18 Posts',
    no_posts_yet: 'No posts yet',
    ready_to_generate: 'Ready to generate posts',
    add_api_key_hint: 'Add your Anthropic API key in Settings to start generating posts with AI.',
    ready_to_generate_hint: 'Generate AI-powered LinkedIn posts tailored to your profile and audience.',
    click_to_collapse: 'Click to collapse',
    schedule_post_title: 'Schedule Post',
    date_label: 'Date',
    cancel: 'Cancel',

    // ScheduleView
    no_scheduled: 'No scheduled posts',
    no_scheduled_hint: 'Schedule posts from the Posts tab to see them here.',
    remove: 'Remove',

    // IdeasView
    no_ideas: 'No ideas yet. Start capturing your thoughts above.',
    no_used_ideas: 'No used ideas.',
    add_idea_placeholder: 'Capture an idea for a post...',
    add: '+ Add',
    mark_used: 'Mark used',
    used: '✓ Used',

    // SettingsView section titles & labels
    profile: 'Profile',
    work_context: 'Work context',
    content_strategy: 'Content strategy',
    integrations: 'Integrations',
    account: 'Account',
    full_name: 'Full name',
    role_title: 'Role / Title',
    location: 'Location',
    bio: 'Bio',
    target_audience: 'Target audience',
    preferred_tones: 'Preferred tones',
    post_language: 'Post language',
    topics_to_avoid: 'Topics / phrases to avoid',
    save_settings: 'Save Settings',
    saving: 'Saving...',
    settings_saved: '✓ Settings saved',
    sign_out: 'Sign Out',
    sign_in_to_save: 'Sign in to save settings',
  },
  uk: {
    // Nav labels
    posts: 'Пости',
    schedule: 'Розклад',
    planner: 'Планер',
    calendar: 'Календар',
    news: 'Новини',
    ideas: 'Ідеї',
    analytics: 'Аналітика',
    settings: 'Налаштування',

    // Tab titles
    tab_posts: 'Пости',
    tab_schedule: 'Заплановано',
    tab_calendar: 'Календар',
    tab_news: 'Новини',
    tab_ideas: 'Ідеї',
    tab_settings: 'Налаштування',
    tab_analytics: 'Аналітика',
    tab_planner: 'Планер контенту',

    // Status pills
    ai_on: 'AI увімк.',
    ai_off: 'AI вимк.',
    li_linked: 'LI підкл.',
    li_unlinked: 'LI відкл.',

    // PostsView buttons & states
    generate_posts: '✦ Згенерувати',
    generating: 'Генерація...',
    copy: 'Копіювати',
    copied: '✓ Скопійовано',
    delete: '✕',
    schedule_post: 'Запланувати',
    generate_18: '✦ Згенерувати 18 постів',
    no_posts_yet: 'Ще немає постів',
    ready_to_generate: 'Готово до генерації',
    add_api_key_hint: 'Додайте API-ключ Anthropic у Налаштуваннях, щоб генерувати пости за допомогою AI.',
    ready_to_generate_hint: 'Генеруйте пости для LinkedIn на основі вашого профілю та аудиторії.',
    click_to_collapse: 'Клікніть, щоб згорнути',
    schedule_post_title: 'Запланувати пост',
    date_label: 'Дата',
    cancel: 'Скасувати',

    // ScheduleView
    no_scheduled: 'Немає запланованих постів',
    no_scheduled_hint: 'Плануйте пости у вкладці Пости, щоб побачити їх тут.',
    remove: 'Видалити',

    // IdeasView
    no_ideas: 'Ще немає ідей. Починайте записувати думки вище.',
    no_used_ideas: 'Немає використаних ідей.',
    add_idea_placeholder: 'Запишіть ідею для поста...',
    add: '+ Додати',
    mark_used: 'Відмітити',
    used: '✓ Використано',

    // SettingsView section titles & labels
    profile: 'Профіль',
    work_context: 'Робочий контекст',
    content_strategy: 'Стратегія контенту',
    integrations: 'Інтеграції',
    account: 'Акаунт',
    full_name: 'Повне ім\'я',
    role_title: 'Роль / Посада',
    location: 'Місцезнаходження',
    bio: 'Біо',
    target_audience: 'Цільова аудиторія',
    preferred_tones: 'Бажані тони',
    post_language: 'Мова постів',
    topics_to_avoid: 'Теми / фрази для уникнення',
    save_settings: 'Зберегти',
    saving: 'Збереження...',
    settings_saved: '✓ Налаштування збережено',
    sign_out: 'Вийти',
    sign_in_to_save: 'Увійдіть, щоб зберегти налаштування',
  },
};

function getInitialLang(): UILang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'uk') return stored;
  } catch {}
  return 'en';
}

// Module-level state so all hook instances share one value
let currentLang: UILang = getInitialLang();
const listeners = new Set<() => void>();

function setGlobalLang(lang: UILang) {
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
  listeners.forEach(fn => fn());
}

export function useUILang() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const t = useCallback((key: string): string => {
    return translations[currentLang][key] ?? translations['en'][key] ?? key;
  }, [currentLang]);

  const setLang = useCallback((lang: UILang) => {
    setGlobalLang(lang);
  }, []);

  return { t, lang: currentLang, setLang };
}
