/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors (Trust, Stability, Compliance)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', // Primary light
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary blue
          700: '#1d4ed8',
          800: '#1e40af', // Primary dark
          900: '#1e3a8a',
          950: '#172554',
        },
        // Brand alias for backward compatibility
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
          950: '#172554',
        },

        // Status Colors (as per design specifications)
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669', // Success green
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706', // Warning yellow
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626', // Danger red
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#06b6d4',
          600: '#0ea5e9', // Info blue
          700: '#0284c7',
          800: '#0369a1',
          900: '#0c4a6e',
        },

        // Compliance status colors
        compliance: {
          compliant: '#059669',
          'non-compliant': '#dc2626',
          'partially-compliant': '#d97706',
          pending: '#6b7280',
          overdue: '#dc2626',
        },

        // Risk level colors
        risk: {
          low: '#059669',
          medium: '#d97706',
          high: '#dc2626',
          critical: '#dc2626',
        },

        // Regulatory priority colors
        priority: {
          urgent: '#dc2626',
          high: '#ea580c',
          medium: '#d97706',
          low: '#65a30d',
        },

        // Neutral Grays (as per design specifications)
        gray: {
          25: '#fcfcfd',
          50: '#f9fafb', // Page background
          100: '#f3f4f6', // Background sections
          200: '#e5e7eb',
          300: '#d1d5db', // Borders, dividers
          400: '#9ca3af',
          500: '#6b7280', // Placeholder text
          600: '#4b5563',
          700: '#374151', // Secondary text
          800: '#1f2937',
          900: '#111827', // Primary text
          950: '#030712',
        },

        // Surface colors
        surface: {
          white: '#ffffff', // Cards, modals
          elevated: '#f8fafc', // Elevated cards
        },

        // Success, warning, error
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
          950: '#052e16',
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
          950: '#451a03',
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
          950: '#450a0a',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
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
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },

      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },

      // Typography Scale (as per design specifications)
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }], // Labels, captions
        'sm': ['14px', { lineHeight: '20px' }], // Body text, secondary info
        'base': ['16px', { lineHeight: '24px' }], // Primary body text
        'lg': ['18px', { lineHeight: '28px' }], // Section headers
        'xl': ['20px', { lineHeight: '28px' }], // Card titles
        '2xl': ['24px', { lineHeight: '32px' }], // Page titles
        '3xl': ['30px', { lineHeight: '36px' }], // Dashboard headers
      },

      // Font Weights (as per design specifications)
      fontWeight: {
        normal: '400', // Regular body text
        medium: '500', // Emphasis, labels
        semibold: '600', // Section headers
        bold: '700', // Page titles, important data
      },

      // Component Heights (as per design specifications)
      height: {
        'input': '40px', // Form inputs, buttons
        'nav': '64px', // Navigation bar
        'card-sm': '120px', // Metric cards
        'card-md': '200px', // Chart cards
        'card-lg': '300px', // Complex components
      },

      // Spacing Scale (Tailwind-based, as per specifications)
      spacing: {
        '18': '4.5rem', // 72px
        '88': '22rem', // 352px
        '128': '32rem', // 512px
      },

      borderRadius: {
        '4xl': '2rem',
      },

      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'hard': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 25px -5px rgba(0, 0, 0, 0.1)',
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'bounce-soft': 'bounceSoft 1s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        bounceSoft: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
          '40%, 43%': { transform: 'translate3d(0, -15px, 0)' },
          '70%': { transform: 'translate3d(0, -7px, 0)' },
          '90%': { transform: 'translate3d(0, -2px, 0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },

      backdropBlur: {
        xs: '2px',
      },

      screens: {
        '3xl': '1600px',
      },

      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/typography'),

    // Custom plugin for utilities
    function({ addUtilities, addComponents, theme }) {
      // Custom utilities
      addUtilities({
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.text-pretty': {
          'text-wrap': 'pretty',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme('colors.gray.100'),
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme('colors.gray.300'),
            'border-radius': '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme('colors.gray.400'),
          },
        },
      });

      // Custom components
      addComponents({
        '.btn': {
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.medium'),
          fontSize: theme('fontSize.sm'),
          lineHeight: theme('lineHeight.5'),
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme('spacing.2'),
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.btn-primary': {
          backgroundColor: theme('colors.brand.600'),
          color: theme('colors.white'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.brand.700'),
          },
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.brand.200')}`,
          },
        },
        '.btn-secondary': {
          backgroundColor: theme('colors.gray.100'),
          color: theme('colors.gray.900'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.gray.200'),
          },
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.gray.300')}`,
          },
        },
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.soft'),
          padding: theme('spacing.6'),
          border: `1px solid ${theme('colors.gray.200')}`,
        },
        '.card-dark': {
          backgroundColor: theme('colors.gray.800'),
          borderColor: theme('colors.gray.700'),
          color: theme('colors.white'),
        },
      });
    },
  ],
};
