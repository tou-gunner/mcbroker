'use client';

import { useState, useEffect } from 'react';
import { MdSave, MdRefresh, MdImage, MdTextFields } from 'react-icons/md';

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
      setMessage({ type: 'error', text: 'Failed to load settings' });
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
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Site Settings</h1>
        <p className="text-gray-500 mt-1">Configure your website content and appearance</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Hero Section Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MdImage className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Hero Section</h2>
              <p className="text-sm text-gray-500">Configure the hero banner text on the homepage</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Title Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <MdTextFields className="w-5 h-5" />
              <span>Hero Title</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  English 🇺🇸
                </label>
                <input
                  type="text"
                  value={settings.hero_title.en}
                  onChange={(e) => handleChange('hero_title', 'en', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter hero title in English"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  ລາວ 🇱🇦
                </label>
                <input
                  type="text"
                  value={settings.hero_title.lo}
                  onChange={(e) => handleChange('hero_title', 'lo', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="ປ້ອນຫົວຂໍ້ເປັນພາສາລາວ"
                />
              </div>
            </div>
          </div>

          {/* Subtitle Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <MdTextFields className="w-5 h-5" />
              <span>Hero Subtitle</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  English 🇺🇸
                </label>
                <textarea
                  value={settings.hero_subtitle.en}
                  onChange={(e) => handleChange('hero_subtitle', 'en', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Enter hero subtitle in English"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  ລາວ 🇱🇦
                </label>
                <textarea
                  value={settings.hero_subtitle.lo}
                  onChange={(e) => handleChange('hero_subtitle', 'lo', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="ປ້ອນຄຳອະທິບາຍເປັນພາສາລາວ"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 bg-gray-900 rounded-lg">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Preview</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">English</p>
                <h3 className="text-2xl font-bold text-white">{settings.hero_title.en}</h3>
                <p className="text-gray-300 mt-1">{settings.hero_subtitle.en}</p>
              </div>
              <div className="border-t border-gray-700 pt-4">
                <p className="text-xs text-gray-500 mb-1">ລາວ</p>
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
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <MdSave className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

