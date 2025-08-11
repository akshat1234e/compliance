/**
 * Design Tokens
 * Centralized design system tokens for consistent styling
 */

export const designTokens = {
  // Colors
  colors: {
    // Brand Colors
    brand: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Semantic Colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // Neutral Colors
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Compliance Status Colors
    compliance: {
      compliant: '#22c55e',
      'non-compliant': '#ef4444',
      'partially-compliant': '#f59e0b',
      pending: '#6b7280',
      overdue: '#dc2626',
    },
    
    // Risk Level Colors
    risk: {
      low: '#22c55e',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626',
    },
    
    // Priority Colors
    priority: {
      urgent: '#dc2626',
      high: '#ea580c',
      medium: '#f59e0b',
      low: '#22c55e',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
    
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
    },
  },
  
  // Spacing
  spacing: {
    px: '1px',
    0: '0px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  
  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    default: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  
  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: '0 0 #0000',
  },
  
  // Z-Index
  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modal: '1040',
    popover: '1050',
    tooltip: '1060',
    toast: '1070',
  },
  
  // Breakpoints
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Animation
  animation: {
    none: 'none',
    spin: 'spin 1s linear infinite',
    ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    bounce: 'bounce 1s infinite',
    'fade-in': 'fadeIn 0.5s ease-in-out',
    'fade-out': 'fadeOut 0.5s ease-in-out',
    'slide-in': 'slideIn 0.3s ease-out',
    'slide-out': 'slideOut 0.3s ease-in',
    'scale-in': 'scaleIn 0.2s ease-out',
    'scale-out': 'scaleOut 0.2s ease-in',
  },
  
  // Transitions
  transitionDuration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  
  transitionTimingFunction: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

// Component-specific tokens
export const componentTokens = {
  button: {
    height: {
      sm: '2rem',
      default: '2.5rem',
      lg: '3rem',
      xl: '3.5rem',
    },
    padding: {
      sm: '0.5rem 0.75rem',
      default: '0.5rem 1rem',
      lg: '0.75rem 2rem',
      xl: '1rem 2.5rem',
    },
  },
  
  input: {
    height: {
      sm: '2rem',
      default: '2.5rem',
      lg: '3rem',
    },
    padding: {
      sm: '0.25rem 0.5rem',
      default: '0.5rem 0.75rem',
      lg: '0.75rem 1rem',
    },
  },
  
  card: {
    padding: {
      sm: '1rem',
      default: '1.5rem',
      lg: '2rem',
    },
    borderRadius: {
      default: '0.5rem',
      lg: '0.75rem',
    },
  },
  
  modal: {
    maxWidth: {
      sm: '28rem',
      default: '32rem',
      lg: '42rem',
      xl: '56rem',
      '2xl': '72rem',
    },
  },
  
  table: {
    cellPadding: {
      sm: '0.5rem',
      default: '1rem',
      lg: '1.5rem',
    },
  },
}

// Utility functions for accessing tokens
export const getColor = (path: string): string => {
  const keys = path.split('.')
  let value: any = designTokens.colors
  
  for (const key of keys) {
    value = value?.[key]
  }
  
  return value || path
}

export const getSpacing = (value: string | number): string => {
  if (typeof value === 'number') {
    return `${value * 0.25}rem`
  }
  return designTokens.spacing[value as keyof typeof designTokens.spacing] || value
}

export const getFontSize = (size: string): string => {
  const fontSize = designTokens.typography.fontSize[size as keyof typeof designTokens.typography.fontSize]
  return Array.isArray(fontSize) ? fontSize[0] : fontSize || size
}

export const getBreakpoint = (screen: string): string => {
  return designTokens.screens[screen as keyof typeof designTokens.screens] || screen
}

// Theme configuration for CSS variables
export const cssVariables = {
  '--color-brand-50': designTokens.colors.brand[50],
  '--color-brand-100': designTokens.colors.brand[100],
  '--color-brand-200': designTokens.colors.brand[200],
  '--color-brand-300': designTokens.colors.brand[300],
  '--color-brand-400': designTokens.colors.brand[400],
  '--color-brand-500': designTokens.colors.brand[500],
  '--color-brand-600': designTokens.colors.brand[600],
  '--color-brand-700': designTokens.colors.brand[700],
  '--color-brand-800': designTokens.colors.brand[800],
  '--color-brand-900': designTokens.colors.brand[900],
  
  '--color-success-50': designTokens.colors.success[50],
  '--color-success-100': designTokens.colors.success[100],
  '--color-success-200': designTokens.colors.success[200],
  '--color-success-300': designTokens.colors.success[300],
  '--color-success-400': designTokens.colors.success[400],
  '--color-success-500': designTokens.colors.success[500],
  '--color-success-600': designTokens.colors.success[600],
  '--color-success-700': designTokens.colors.success[700],
  '--color-success-800': designTokens.colors.success[800],
  '--color-success-900': designTokens.colors.success[900],
  
  '--color-warning-50': designTokens.colors.warning[50],
  '--color-warning-100': designTokens.colors.warning[100],
  '--color-warning-200': designTokens.colors.warning[200],
  '--color-warning-300': designTokens.colors.warning[300],
  '--color-warning-400': designTokens.colors.warning[400],
  '--color-warning-500': designTokens.colors.warning[500],
  '--color-warning-600': designTokens.colors.warning[600],
  '--color-warning-700': designTokens.colors.warning[700],
  '--color-warning-800': designTokens.colors.warning[800],
  '--color-warning-900': designTokens.colors.warning[900],
  
  '--color-error-50': designTokens.colors.error[50],
  '--color-error-100': designTokens.colors.error[100],
  '--color-error-200': designTokens.colors.error[200],
  '--color-error-300': designTokens.colors.error[300],
  '--color-error-400': designTokens.colors.error[400],
  '--color-error-500': designTokens.colors.error[500],
  '--color-error-600': designTokens.colors.error[600],
  '--color-error-700': designTokens.colors.error[700],
  '--color-error-800': designTokens.colors.error[800],
  '--color-error-900': designTokens.colors.error[900],
  
  '--font-family-sans': designTokens.typography.fontFamily.sans.join(', '),
  '--font-family-mono': designTokens.typography.fontFamily.mono.join(', '),
  
  '--border-radius-sm': designTokens.borderRadius.sm,
  '--border-radius-default': designTokens.borderRadius.default,
  '--border-radius-md': designTokens.borderRadius.md,
  '--border-radius-lg': designTokens.borderRadius.lg,
  '--border-radius-xl': designTokens.borderRadius.xl,
  
  '--shadow-sm': designTokens.boxShadow.sm,
  '--shadow-default': designTokens.boxShadow.default,
  '--shadow-md': designTokens.boxShadow.md,
  '--shadow-lg': designTokens.boxShadow.lg,
  '--shadow-xl': designTokens.boxShadow.xl,
}
