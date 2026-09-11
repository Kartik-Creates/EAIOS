import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { en } from '@/i18n/translations/en';
import { hi } from '@/i18n/translations/hi';
import { mr } from '@/i18n/translations/mr';

export type Language = 'en' | 'hi' | 'mr';

const translations: Record<Language, any> = {
  en,
  hi,
  mr
};

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = 'eaios-language';

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem(LANG_STORAGE_KEY) as Language;
  if (stored === 'en' || stored === 'hi' || stored === 'mr') {
    return stored;
  }
  try {
    const prefRaw = localStorage.getItem('eaios_preferences');
    if (prefRaw) {
      const parsed = JSON.parse(prefRaw);
      const prefLang = parsed?.language?.language;
      if (prefLang === 'en' || prefLang === 'hi' || prefLang === 'mr') {
        return prefLang;
      }
      if (prefLang === 'english') return 'en';
      if (prefLang === 'hindi') return 'hi';
      if (prefLang === 'marathi') return 'mr';
    }
  } catch {
    // ignore
  }
  return 'en';
};

const getNestedValue = (obj: any, pathKeys: string[]): any => {
  let current = obj;
  for (const k of pathKeys) {
    if (current === undefined || current === null) return undefined;
    current = current[k];
  }
  return typeof current === 'string' ? current : undefined;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, language);
    document.documentElement.lang = language;

    // Sync with eaios_preferences if present
    try {
      const stored = localStorage.getItem('eaios_preferences');
      const prefs = stored ? JSON.parse(stored) : {};
      if (!prefs.language) prefs.language = {};
      prefs.language.language = language;
      localStorage.setItem('eaios_preferences', JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    if (!key) return '';
    const keys = key.split('.');
    
    // 1. Try target language
    let result = getNestedValue(translations[language], keys);

    // 2. Fallback to English if missing in target language
    if (result === undefined && language !== 'en') {
      result = getNestedValue(translations.en, keys);
    }

    // 3. Fallback to last segment of key or full key string
    if (result === undefined) {
      result = keys[keys.length - 1] || key;
    }

    // Interpolate params: e.g. {count}, {provider}, {name}
    if (params && typeof result === 'string') {
      let interpolated = result;
      Object.entries(params).forEach(([pK, pV]) => {
        interpolated = interpolated.replace(new RegExp(`\\{${pK}\\}`, 'g'), String(pV));
      });
      return interpolated;
    }

    return String(result);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

