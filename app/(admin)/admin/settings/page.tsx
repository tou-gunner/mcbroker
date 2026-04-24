'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSave, MdRefresh, MdImage, MdTextFields, MdLanguage } from 'react-icons/md';

interface SettingValue {
  en: string;
  lo: string;
}

interface HeroSettings {
  hero_title: SettingValue;
  hero_subtitle: SettingValue;
}

const defaultSettings: HeroSettings = {
  hero_title: { en: 'MC Broker', lo: 'MC Broker' },
  hero_subtitle: { en: 'Your Trusted Insurance Partner', lo: 'ຄູ່ຮ່ວມງານປະກັນໄພທີ່ທ່ານໄວ້ວາງໃຈ' }
};

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<HeroSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const result = await response.json();

      if (result.success && result.grouped) {
        setSettings({
          hero_title: {
            en: result.grouped.hero_title?.en || defaultSettings.hero_title.en,
            lo: result.grouped.hero_title?.lo || defaultSettings.hero_title.lo
          },
          hero_subtitle: {
            en: result.grouped.hero_subtitle?.en || defaultSettings.hero_subtitle.en,
            lo: result.grouped.hero_subtitle?.lo || defaultSettings.hero_subtitle.lo
          }
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: t('settings.loadFailed') });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const settingsArray = [
        { key: 'hero_title', value: settings.hero_title.en, locale: 'en' },
        { key: 'hero_title', value: settings.hero_title.lo, locale: 'lo' },
        { key: 'hero_subtitle', value: settings.hero_subtitle.en, locale: 'en' },
        { key: 'hero_subtitle', value: settings.hero_subtitle.lo, locale: 'lo' }
      ];

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsArray })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: t('settings.savedSuccess') });
      } else {
        setMessage({ type: 'error', text: result.error || t('settings.saveFailed') });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: t('settings.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof HeroSettings, locale: 'en' | 'lo', value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [locale]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentLanguage = (i18n.resolvedLanguage || i18n.language || 'lo').slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('settings.title')}</h1>
        <p className="text-gray-500 mt-1">{t('settings.subtitle')}</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Admin Language */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MdLanguage className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{t('settings.adminLanguage')}</h2>
              <p className="text-sm text-gray-500">{t('settings.adminLanguageHint')}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {(['lo', 'en'] as const).map((lng) => {
              const isActive = currentLanguage === lng;
              return (
                <button
                  key={lng}
                  type="button"
                  onClick={() => i18n.changeLanguage(lng)}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-pressed={isActive}
                >
                  {lng === 'en' ? t('settings.languageEnglish') : t('settings.languageLao')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hero Section Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MdImage className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{t('settings.heroSection')}</h2>
              <p className="text-sm text-gray-500">{t('settings.heroSectionSubtitle')}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Title Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <MdTextFields className="w-5 h-5" />
              <span>{t('settings.heroTitle')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {t('settings.english')} 🇺🇸
                </label>
                <input
                  type="text"
                  value={settings.hero_title.en}
                  onChange={(e) => handleChange('hero_title', 'en', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder={t('settings.heroTitleEnPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {t('settings.lao')} 🇱🇦
                </label>
                <input
                  type="text"
                  value={settings.hero_title.lo}
                  onChange={(e) => handleChange('hero_title', 'lo', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder={t('settings.heroTitleLoPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Subtitle Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <MdTextFields className="w-5 h-5" />
              <span>{t('settings.heroSubtitle')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {t('settings.english')} 🇺🇸
                </label>
                <textarea
                  value={settings.hero_subtitle.en}
                  onChange={(e) => handleChange('hero_subtitle', 'en', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
                  placeholder={t('settings.heroSubtitleEnPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {t('settings.lao')} 🇱🇦
                </label>
                <textarea
                  value={settings.hero_subtitle.lo}
                  onChange={(e) => handleChange('hero_subtitle', 'lo', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
                  placeholder={t('settings.heroSubtitleLoPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 bg-gray-900 rounded-lg">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">{t('settings.preview')}</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('settings.english')}</p>
                <h3 className="text-2xl font-bold text-white">{settings.hero_title.en}</h3>
                <p className="text-gray-300 mt-1">{settings.hero_subtitle.en}</p>
              </div>
              <div className="border-t border-gray-700 pt-4">
                <p className="text-xs text-gray-500 mb-1">{t('settings.lao')}</p>
                <h3 className="text-2xl font-bold text-white">{settings.hero_title.lo}</h3>
                <p className="text-gray-300 mt-1">{settings.hero_subtitle.lo}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={fetchSettings}
            disabled={loading || saving}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <MdRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('settings.refresh')}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('settings.saving')}</span>
              </>
            ) : (
              <>
                <MdSave className="w-5 h-5" />
                <span>{t('settings.saveChanges')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
