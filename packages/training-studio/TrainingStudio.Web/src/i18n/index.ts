/**
 * Internationalization (i18n) Module
 *
 * Provides string localization infrastructure with:
 * - Resource loading from JSON locale files
 * - Interpolation support ({variable} syntax)
 * - Fallback to default locale (en-US)
 * - RTL layout detection
 */

export type Locale = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'ja-JP' | 'zh-CN';

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English', direction: 'ltr' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', direction: 'ltr' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr' }
];

export const DEFAULT_LOCALE: Locale = 'en-US';

type StringKeys = keyof typeof import('./locales/en-US.json');
type Strings = Record<StringKeys, string>;

let currentLocale: Locale = DEFAULT_LOCALE;
let strings: Partial<Strings> = {};
let defaultStrings: Partial<Strings> = {};

/**
 * Initialize i18n with detected or stored locale
 */
export async function initI18n(preferredLocale?: Locale): Promise<void> {
  // Priority: explicit preference > stored > browser > default
  const locale = preferredLocale
    || getStoredLocale()
    || detectBrowserLocale()
    || DEFAULT_LOCALE;

  await setLocale(locale);
}

/**
 * Get stored locale from localStorage
 */
function getStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem('training-studio-locale');
    if (stored && SUPPORTED_LOCALES.some(l => l.code === stored)) {
      return stored as Locale;
    }
  } catch {
    // localStorage not available
  }
  return null;
}

/**
 * Detect locale from browser settings
 */
function detectBrowserLocale(): Locale | null {
  const browserLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage;
  if (!browserLang) return null;

  // Exact match first
  const exact = SUPPORTED_LOCALES.find(l => l.code === browserLang);
  if (exact) return exact.code;

  // Language prefix match (e.g., 'en' matches 'en-US')
  const langPrefix = browserLang.split('-')[0].toLowerCase();
  const prefixMatch = SUPPORTED_LOCALES.find(l => l.code.toLowerCase().startsWith(langPrefix));
  if (prefixMatch) return prefixMatch.code;

  return null;
}

/**
 * Load locale strings from JSON file
 */
async function loadLocaleStrings(locale: Locale): Promise<Partial<Strings>> {
  try {
    // Dynamic import for locale files
    const module = await import(`./locales/${locale}.json`);
    return module.default || module;
  } catch (error) {
    console.warn(`Failed to load locale ${locale}, falling back to ${DEFAULT_LOCALE}`);
    if (locale !== DEFAULT_LOCALE) {
      return loadLocaleStrings(DEFAULT_LOCALE);
    }
    return {};
  }
}

/**
 * Set the current locale
 */
export async function setLocale(locale: Locale): Promise<void> {
  // Load default strings first (for fallback)
  if (Object.keys(defaultStrings).length === 0) {
    defaultStrings = await loadLocaleStrings(DEFAULT_LOCALE);
  }

  // Load requested locale
  if (locale === DEFAULT_LOCALE) {
    strings = defaultStrings;
  } else {
    strings = await loadLocaleStrings(locale);
  }

  currentLocale = locale;

  // Store preference
  try {
    localStorage.setItem('training-studio-locale', locale);
  } catch {
    // localStorage not available
  }

  // Update document direction for RTL languages
  const localeInfo = SUPPORTED_LOCALES.find(l => l.code === locale);
  if (localeInfo) {
    document.documentElement.dir = localeInfo.direction;
    document.documentElement.lang = locale;
  }

  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }));
}

/**
 * Get the current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Get locale info for current locale
 */
export function getLocaleInfo(): LocaleInfo {
  return SUPPORTED_LOCALES.find(l => l.code === currentLocale) || SUPPORTED_LOCALES[0];
}

/**
 * Check if current locale is RTL
 */
export function isRTL(): boolean {
  return getLocaleInfo().direction === 'rtl';
}

/**
 * Get a localized string with optional interpolation
 *
 * @param key - The string key to look up
 * @param params - Optional parameters for interpolation
 * @returns The localized string or the key if not found
 *
 * @example
 * t('common.loading') // "Loading..."
 * t('training.epochProgress', { current: 5, total: 10 }) // "Epoch 5 of 10"
 */
export function t(key: string, params?: Record<string, string | number>): string {
  // Look up in current locale, fallback to default, fallback to key
  let value = strings[key as StringKeys] ?? defaultStrings[key as StringKeys] ?? key;

  // Interpolate parameters
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    });
  }

  return value;
}

/**
 * Format a number according to current locale
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(currentLocale, options).format(value);
}

/**
 * Format a percentage according to current locale
 */
export function formatPercent(value: number, decimals = 1): string {
  return new Intl.NumberFormat(currentLocale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format a date according to current locale
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(currentLocale, options).format(date);
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' });

  if (diffDays > 0) return rtf.format(-diffDays, 'day');
  if (diffHours > 0) return rtf.format(-diffHours, 'hour');
  if (diffMins > 0) return rtf.format(-diffMins, 'minute');
  return rtf.format(-diffSecs, 'second');
}

/**
 * Get all string keys (useful for tooling/validation)
 */
export function getAllStringKeys(): string[] {
  return Object.keys(defaultStrings);
}

/**
 * Check if a string key exists
 */
export function hasString(key: string): boolean {
  return key in strings || key in defaultStrings;
}
