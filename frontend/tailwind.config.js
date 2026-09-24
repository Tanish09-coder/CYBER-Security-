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
          navy:       '#003087',
          navydark:   '#001F5B',
          navylight:  '#E8EDF7',
          saffron:    '#FF6200',
          saffronlight: '#FFF0E6',
          green:      '#138808',
          white:      '#FFFFFF',
          offwhite:   '#F5F5F5',
          border:     '#D0D7E3',
          borderdark: '#B0BAC9',
          text:       '#1A1A2E',
          textmuted:  '#5A6478',
          tablerow:   '#FAFBFC',
          tablerowalt:'#F0F3F8',
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
