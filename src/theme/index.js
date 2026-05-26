// TileHub Pro — Design System
// Inspired by Stripe/Linear — clean, professional, blue-primary

export const Colors = {
  // Primary brand — deep blue
  primary: '#1E40AF',
  primaryLight: '#3B82F6',
  primaryDark: '#1E3A8A',
  primaryBg: '#EFF6FF',
  primaryBorder: '#BFDBFE',

  // Accent
  accent: '#0EA5E9',
  accentBg: '#F0F9FF',

  // Success
  success: '#16A34A',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',

  // Warning
  warning: '#D97706',
  warningBg: '#FFFBEB',
  warningBorder: '#FCD34D',

  // Danger
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',

  // Neutrals
  gray50:  '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  white: '#FFFFFF',
  black: '#000000',

  // Role colors
  admin:      '#7C3AED',
  sales:      '#1D4ED8',
  warehouse:  '#D97706',
  accountant: '#059669',
  customer:   '#DB2777',
};

export const Typography = {
  // Font sizes
  xs:   11,
  sm:   13,
  base: 15,
  lg:   17,
  xl:   20,
  '2xl': 24,
  '3xl': 30,

  // Font weights
  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
};

export const Spacing = {
  1: 4,   2: 8,   3: 12,  4: 16,
  5: 20,  6: 24,  8: 32,  10: 40,
  12: 48, 16: 64,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
