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
          bg: '#F7F8FA',
          surface: '#FFFFFF',
          secondary: '#F1F3F5',
          border: '#E5E7EB',
          borderSecondary: '#D1D5DB',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        brand: {
          primary: '#2563EB',
          accent: '#0F766E',
          financial: '#7C3AED',
        },
        risk: {
          low: '#15803D',
          moderate: '#D97706',
          high: '#EA580C',
          critical: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
