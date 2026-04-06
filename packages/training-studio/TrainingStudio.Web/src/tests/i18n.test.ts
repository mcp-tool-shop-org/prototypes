/**
 * Internationalization Module Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the locale file imports
vi.mock('../i18n/locales/en-US.json', () => ({
  default: {
    'app.title': 'Training Studio',
    'training.epochProgress': 'Epoch {current} of {total}',
    'common.loading': 'Loading...',
    'footer.version': 'Version {version}'
  }
}));

// Import after mocking
import {
  initI18n,
  setLocale,
  getLocale,
  getLocaleInfo,
  isRTL,
  t,
  formatNumber,
  formatPercent,
  formatDate,
  getAllStringKeys,
  hasString,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE
} from '../i18n';

describe('i18n', () => {
  beforeEach(async () => {
    // Reset to default locale
    await setLocale('en-US');
    // Clear localStorage mock
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  });

  describe('SUPPORTED_LOCALES', () => {
    it('includes en-US as supported', () => {
      const enUS = SUPPORTED_LOCALES.find(l => l.code === 'en-US');
      expect(enUS).toBeDefined();
      expect(enUS?.name).toBe('English (US)');
      expect(enUS?.direction).toBe('ltr');
    });

    it('has at least 3 supported locales', () => {
      expect(SUPPORTED_LOCALES.length).toBeGreaterThanOrEqual(3);
    });

    it('all locales have required fields', () => {
      SUPPORTED_LOCALES.forEach(locale => {
        expect(locale.code).toBeTruthy();
        expect(locale.name).toBeTruthy();
        expect(locale.nativeName).toBeTruthy();
        expect(['ltr', 'rtl']).toContain(locale.direction);
      });
    });
  });

  describe('setLocale and getLocale', () => {
    it('defaults to en-US', () => {
      expect(getLocale()).toBe('en-US');
    });

    it('changes locale when set', async () => {
      await setLocale('es-ES');
      expect(getLocale()).toBe('es-ES');
    });

    it('stores locale preference in localStorage', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      await setLocale('fr-FR');
      expect(setItemSpy).toHaveBeenCalledWith('training-studio-locale', 'fr-FR');
    });
  });

  describe('getLocaleInfo', () => {
    it('returns info for current locale', async () => {
      await setLocale('en-US');
      const info = getLocaleInfo();
      expect(info.code).toBe('en-US');
      expect(info.name).toBe('English (US)');
    });
  });

  describe('isRTL', () => {
    it('returns false for LTR locales', async () => {
      await setLocale('en-US');
      expect(isRTL()).toBe(false);
    });
  });

  describe('t (translate)', () => {
    it('returns translated string for known key', async () => {
      await initI18n('en-US');
      expect(t('app.title')).toBe('Training Studio');
    });

    it('returns key for unknown string', async () => {
      await initI18n('en-US');
      expect(t('unknown.key')).toBe('unknown.key');
    });

    it('interpolates single parameter', async () => {
      await initI18n('en-US');
      const result = t('footer.version', { version: '1.0.0' });
      expect(result).toBe('Version 1.0.0');
    });

    it('interpolates multiple parameters', async () => {
      await initI18n('en-US');
      const result = t('training.epochProgress', { current: 5, total: 10 });
      expect(result).toBe('Epoch 5 of 10');
    });

    it('handles numeric parameters', async () => {
      await initI18n('en-US');
      const result = t('training.epochProgress', { current: 1, total: 100 });
      expect(result).toBe('Epoch 1 of 100');
    });
  });

  describe('formatNumber', () => {
    it('formats integers', () => {
      const result = formatNumber(1234567);
      expect(result).toContain('1'); // At least contains the number
      expect(result.replace(/[,.\s]/g, '')).toBe('1234567');
    });

    it('formats decimals with options', () => {
      const result = formatNumber(1234.567, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      // Result may have thousands separator like "1,234.57" depending on locale
      expect(result).toMatch(/1[,.]?234/);
      expect(result).toContain('57'); // Rounded from .567
    });
  });

  describe('formatPercent', () => {
    it('formats percentage', () => {
      const result = formatPercent(0.856, 1);
      expect(result).toContain('85');
      expect(result).toContain('%');
    });

    it('respects decimal places', () => {
      const result = formatPercent(0.8567, 2);
      expect(result).toContain('85');
    });
  });

  describe('formatDate', () => {
    it('formats date object', () => {
      const date = new Date('2026-02-02T12:00:00Z');
      const result = formatDate(date);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('accepts format options', () => {
      const date = new Date('2026-02-02T12:00:00Z');
      const result = formatDate(date, { year: 'numeric', month: 'long' });
      expect(result).toContain('2026');
    });
  });

  describe('getAllStringKeys', () => {
    it('returns array of keys', async () => {
      await initI18n('en-US');
      const keys = getAllStringKeys();
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('includes known keys', async () => {
      await initI18n('en-US');
      const keys = getAllStringKeys();
      expect(keys).toContain('app.title');
    });
  });

  describe('hasString', () => {
    it('returns true for known key', async () => {
      await initI18n('en-US');
      expect(hasString('app.title')).toBe(true);
    });

    it('returns false for unknown key', async () => {
      await initI18n('en-US');
      expect(hasString('nonexistent.key')).toBe(false);
    });
  });

  describe('DEFAULT_LOCALE', () => {
    it('is en-US', () => {
      expect(DEFAULT_LOCALE).toBe('en-US');
    });
  });
});
