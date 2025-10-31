import { StoreTheme } from '@/types';

export interface ThemeConfig {
  id: StoreTheme;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export const themes: Record<StoreTheme, ThemeConfig> = {
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design with bold typography',
    preview: 'A sleek, minimalist design with plenty of whitespace',
    colors: {
      primary: '#2563eb', // Blue
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#1e293b',
    },
    fonts: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif',
    },
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless and elegant with refined details',
    preview: 'Traditional layout with elegant serif typography',
    colors: {
      primary: '#16a34a', // Green
      secondary: '#737373',
      accent: '#dc2626',
      background: '#fafaf9',
      text: '#292524',
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'system-ui, sans-serif',
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and focused with maximum clarity',
    preview: 'Ultra-clean design with focus on products',
    colors: {
      primary: '#0f172a', // Dark Navy
      secondary: '#94a3b8',
      accent: '#8b5cf6',
      background: '#ffffff',
      text: '#334155',
    },
    fonts: {
      heading: 'system-ui, sans-serif',
      body: 'system-ui, sans-serif',
    },
  },
};

export const getTheme = (themeId: StoreTheme): ThemeConfig => {
  return themes[themeId] || themes.modern;
};
