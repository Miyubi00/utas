import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_SITE_SETTINGS } from '../config/site';
import type { SiteSettings } from '../types';
import { dataService } from './dataService';

interface SiteSettingsContextValue {
  settings: SiteSettings;
  authorHandle: string;
  isLoading: boolean;
  saveSettings: (settings: SiteSettings) => Promise<SiteSettings>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    dataService.getSiteSettings()
      .then((saved) => { if (active) setSettings(saved); })
      .catch((error: unknown) => {
        console.warn('Pengaturan situs belum dapat dimuat:', error);
      })
      .finally(() => { if (active) setIsLoading(false); });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.title = settings.site_name;
  }, [settings.site_name]);

  const saveSettings = async (nextSettings: SiteSettings) => {
    const saved = await dataService.saveSiteSettings(nextSettings);
    setSettings(saved);
    return saved;
  };

  const cleanUsername = settings.username.trim().replace(/^@+/, '') || DEFAULT_SITE_SETTINGS.username;
  const value: SiteSettingsContextValue = {
    settings,
    authorHandle: `@${cleanUsername}`,
    isLoading,
    saveSettings,
  };

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
};

export const useSiteSettings = (): SiteSettingsContextValue => {
  const context = useContext(SiteSettingsContext);
  if (!context) throw new Error('useSiteSettings harus digunakan di dalam SiteSettingsProvider');
  return context;
};
