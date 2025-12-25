'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// Import locale files
import en from '@/locales/en.json';
import es from '@/locales/es.json';

// Supported locales
export type Locale = 'en' | 'es';

// Locale data type
type LocaleData = typeof en;

// All available locales
const locales: Record<Locale, LocaleData> = {
  en,
  es,
};

// Locale metadata
export const localeMetadata: Record<Locale, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
};

// Context type
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLocales: Locale[];
}

// Create context
const I18nContext = createContext<I18nContextType | null>(null);

// Get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : undefined;
}

// Interpolate variables in string
function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key]?.toString() ?? `{{${key}}}`;
  });
}

// Provider props
interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

// I18n Provider
export function I18nProvider({ children, defaultLocale = 'en' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  
  // Initialize locale from storage or browser
  useEffect(() => {
    const stored = localStorage.getItem('laboro-locale') as Locale | null;
    if (stored && locales[stored]) {
      setLocaleState(stored);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0] as Locale;
      if (locales[browserLang]) {
        setLocaleState(browserLang);
      }
    }
  }, []);
  
  // Set locale and persist
  const setLocale = useCallback((newLocale: Locale) => {
    if (locales[newLocale]) {
      setLocaleState(newLocale);
      localStorage.setItem('laboro-locale', newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);
  
  // Translation function
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const value = getNestedValue(locales[locale] as unknown as Record<string, unknown>, key);
    
    if (!value) {
      // Fallback to English
      const fallback = getNestedValue(locales.en as unknown as Record<string, unknown>, key);
      if (!fallback) {
        console.warn(`Missing translation for key: ${key}`);
        return key;
      }
      return params ? interpolate(fallback, params) : fallback;
    }
    
    return params ? interpolate(value, params) : value;
  }, [locale]);
  
  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    availableLocales: Object.keys(locales) as Locale[],
  };
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use i18n
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Hook to get just the translation function
export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}

// Utility to format dates in locale
export function formatDateLocale(date: Date | string, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, options);
}

// Utility to format numbers in locale
export function formatNumberLocale(num: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return num.toLocaleString(locale, options);
}

// Utility to format currency in locale
export function formatCurrencyLocale(amount: number, locale: Locale, currency = 'USD'): string {
  return amount.toLocaleString(locale, {
    style: 'currency',
    currency,
  });
}

export default I18nProvider;
