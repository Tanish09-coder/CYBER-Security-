/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#F0F4F8',
          surface: '#FFFFFF',
          surfaceSecondary: '#EBF0F7',
          border: '#C5D0DC',
          navyDark: '#040270',
        },
        text: {
          primary: '#1A1A2E',
          secondary: '#3D4A5C',
          muted: '#6B7A8D',
          onNavy: '#FFFFFF',
          onSaffron: '#FFFFFF',
        },
        brand: {
          primary: '#FF671F',       // Saffron
          secondary: '#06038D',     // India Navy Blue
          financial: '#7C3AED',
          saffron: '#FF671F',
          navy: '#06038D',
          navyLight: '#1A3A8F',
          green: '#046A38',         // India Green
          greenLight: '#0D8A4E',
        },
        risk: {
          success: '#046A38',       // India Green
          warning: '#D97706',
          critical: '#C0392B',
          successLight: '#E8F5EF',
          warningLight: '#FEF3C7',
          criticalLight: '#FEE2E2',
        },
        gov: {
          saffron: '#FF671F',
          navy: '#06038D',
          green: '#046A38',
          lightBlue: '#E8EEF9',
          saffronLight: '#FFF0E8',
          greenLight: '#E6F4EC',
          headerBg: '#040270',
          bannerBg: '#FF671F',
          tableBg: '#EBF0F7',
          tableAlt: '#F7F9FC',
        }
      },
      fontFamily: {
        sans: ['Noto Sans', 'Public Sans', 'system-ui', 'sans-serif'],
        mono: ['Noto Sans Mono', 'IBM Plex Mono', 'monospace'],
        display: ['Noto Sans', 'Public Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out forwards',
        'slide-up': 'slideUp 0.15s ease-out forwards',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}
