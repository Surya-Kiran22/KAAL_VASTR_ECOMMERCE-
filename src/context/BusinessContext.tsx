import React, { createContext, useContext, useEffect, useState } from 'react';
import { BusinessSettings } from '../types';
import { fetchBusinessSettings, saveBusinessSettings } from '../lib/supabase';

interface BusinessContextType {
  settings: BusinessSettings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<BusinessSettings>) => Promise<boolean>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBusinessSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load business settings:', err);
      setError('Failed to load store business details');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<BusinessSettings>): Promise<boolean> => {
    try {
      const updated = await saveBusinessSettings(newSettings);
      setSettings(updated);
      return true;
    } catch (err) {
      console.error('Failed to update business settings:', err);
      return false;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <BusinessContext.Provider value={{ settings, loading, error, refreshSettings: loadSettings, updateSettings }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
