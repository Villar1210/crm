import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../constants';
import { ApiClient } from '../services/api';

export type SiteConfig = typeof APP_CONFIG & {
  tagline?: string;
  footerText?: string;
  primaryColor?: string;
  logo?: string;
};

let cachedConfig: SiteConfig | null = null;

export const useSiteConfig = () => {
  const [config, setConfig] = useState<SiteConfig>(cachedConfig || APP_CONFIG);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    if (cachedConfig) return;

    const load = async () => {
      try {
        const data = await ApiClient.get('/settings/site');
        if (data) {
          const merged: SiteConfig = {
            ...APP_CONFIG,
            companyName: data.companyName || APP_CONFIG.companyName,
            whatsapp: data.whatsapp || APP_CONFIG.whatsapp,
            address: data.address || APP_CONFIG.address,
            email: data.email || APP_CONFIG.email,
            tagline: data.tagline,
            footerText: data.footerText || 'Desenvolvido por Daniel Villar',
            primaryColor: data.primaryColor || '#4f46e5',
            social: {
              instagram: data.instagram || APP_CONFIG.social.instagram,
              facebook: data.facebook || APP_CONFIG.social.facebook,
              linkedin: APP_CONFIG.social.linkedin,
            }
          };
          cachedConfig = merged;
          setConfig(merged);
        }
      } catch {
        // Usa APP_CONFIG padrão se falhar
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { config, loading };
};
