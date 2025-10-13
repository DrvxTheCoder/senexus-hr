export const DEFAULT_THEMES = [
  {
    name: 'Défaut',
    value: 'default',
    color: '#3b82f6' // blue-500
  },
  {
    name: 'Bleu',
    value: 'blue',
    color: '#2563eb' // blue-600
  },
  {
    name: 'Vert',
    value: 'green',
    color: '#16a34a' // green-600
  },
  {
    name: 'Ambre',
    value: 'amber',
    color: '#d97706' // amber-600
  }
] as const;

export type ThemeValue = (typeof DEFAULT_THEMES)[number]['value'];
