/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { en } from '@/i18n/translations/en';
import { hi } from '@/i18n/translations/hi';
import { mr } from '@/i18n/translations/mr';
import { createContext, type Context } from 'react';

export type Language = 'en' | 'hi' | 'mr';

export interface TranslationSchema {
  [key: string]: string | TranslationSchema;
}

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const LanguageContext: Context<LanguageContextType | undefined> =
  createContext<LanguageContextType | undefined>(undefined);

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
      const parsed = JSON.parse(prefRaw) as { language?: { language?: string } };
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

const getNestedValue = (
  obj: TranslationSchema | undefined,
  pathKeys: string[]
): string | undefined => {
  let current: unknown = obj;
  for (const k of pathKeys) {
    if (current === undefined || current === null) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[k];
  }
  return typeof current === 'string' ? current : undefined;
};

const translationsRecord: Record<Language, TranslationSchema> = {
  en: en as TranslationSchema,
  hi: hi as TranslationSchema,
  mr: mr as TranslationSchema,
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem('eaios-language', language);
    document.documentElement.lang = language;

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

    let result = getNestedValue(translationsRecord[language], keys);

    if (result === undefined && language !== 'en') {
      result = getNestedValue(translationsRecord.en, keys);
    }

    if (result === undefined) {
      result = keys[keys.length - 1] || key;
    }

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

export default LanguageProvider;