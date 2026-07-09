/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1a7c45',
          dark: '#14142B',
          light: '#23995a',
          tint: '#e6f4ec',
        },
        accent: {
          DEFAULT: '#1a7c45',
          light: '#23995a',
          tint: '#e6f4ec',
        },
        canvas: '#F4F4F9',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 20, 43, 0.04), 0 8px 24px rgba(108, 92, 231, 0.08)',
        soft: '0 1px 2px rgba(20, 20, 43, 0.05)',
        panel: '0 20px 60px rgba(20, 20, 43, 0.08)',
      },
    },
  },
  plugins: [],
};
