/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        onix: {
          DEFAULT: '#150B0A',
          surface: '#1F1311',
          surfaceHover: '#2A1A17',
          border: '#3A211D',
        },
        lobo: {
          gold: '#F2B705',
          goldDark: '#C79304',
          red: '#7A1518',
        },
      },
    },
  },
  plugins: [],
};
