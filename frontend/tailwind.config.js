/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy:     '#003087',   // Deep government navy (NIC / MeitY primary)
          navyDark: '#001F5B',   // Darker navy for sidebar header
          navyLight:'#E8EDF7',   // Very light blue tint for hover/active
          saffron:  '#FF6200',   // Indian flag saffron accent
          saffronLight: '#FFF0E6',
          green:    '#138808',   // Indian flag green for success/operational
          white:    '#FFFFFF',
          offWhite: '#F5F5F5',   // Government portal background
          border:   '#D0D7E3',   // Standard rule line
          borderDark:'#B0BAC9',
          text:     '#1A1A2E',   // Near-black for body text
          textMuted:'#5A6478',   // Secondary text
          tableRow: '#FAFBFC',   // Alternating row background
          tableRowAlt: '#F0F3F8',
        },
        app: {
          bg:              '#F5F5F5',
          surface:         '#FFFFFF',
          surfaceSecondary:'#EFF2F7',
          border:          '#D0D7E3',
        },
        text: {
          primary:  '#1A1A2E',
          secondary:'#5A6478',
          muted:    '#8A94A8',
        },
        brand: {
          primary:   '#003087',
          secondary: '#138808',
          financial: '#003087',
        },
        risk: {
          success:  '#138808',
          warning:  '#FF6200',
          critical: '#C0020A',
        }
      },
      fontFamily: {
        sans: ['"Source Sans 3"', '"Noto Sans"', 'Arial', 'sans-serif'],
        mono: ['"Courier New"', 'monospace'],
      },
      fontSize: {
        'gov-xs':  ['11px', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        'gov-sm':  ['12px', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'gov-base':['13px', { lineHeight: '1.6' }],
        'gov-md':  ['14px', { lineHeight: '1.5' }],
        'gov-lg':  ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'gov-xl':  ['18px', { lineHeight: '1.3', fontWeight: '700' }],
        'gov-2xl': ['22px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'fade-in': 'fadeIn 0.1s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
