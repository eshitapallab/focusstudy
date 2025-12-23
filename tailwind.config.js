/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // FocusStudy Brand Colors - Calm & Supportive
        primary: {
          DEFAULT: '#4F7CAC',
          50: '#EEF3F9',
          100: '#DCE7F3',
          200: '#B9CFE7',
          300: '#96B7DB',
          400: '#739FCF',
          500: '#4F7CAC',
          600: '#3F6389',
          700: '#2F4A67',
          800: '#203244',
          900: '#101922',
        },
        'primary-accent': {
          DEFAULT: '#6FB3A2',
          50: '#F1F9F7',
          100: '#E3F3EF',
          200: '#C7E7DF',
          300: '#ABDCCF',
          400: '#8FC8BF',
          500: '#6FB3A2',
          600: '#598F82',
          700: '#436B61',
          800: '#2C4841',
          900: '#162420',
        },
        background: '#F7F9FC',
        surface: '#EEF2F7',
        'text-primary': '#1F2933',
        'text-secondary': '#4B5563',
        warning: '#F2C94C',
        // Keep neutral for backwards compatibility
        neutral: {
          DEFAULT: '#6b7280',
          light: '#9ca3af',
          dark: '#374151',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      }
    },
  },
  plugins: [],
}
