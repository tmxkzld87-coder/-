export const colors = {
  primaryBlue: '#3182F6',
  darkText: '#191F28',
  secondaryText: '#8B95A1',
  divider: '#F2F4F6',
  background: '#FFFFFF',
  lightBlueBackground: '#EAF3FF',
  success: '#20C997',
  warning: '#FFB020',
  error: '#F04452',
} as const;

export type ColorToken = keyof typeof colors;
