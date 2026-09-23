/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0C0C0E',
          surface: '#141416',
          card: '#1A1A1E',
          border: '#27272A',
          muted: '#71717A',
          secondary: '#A1A1AA',
          light: '#E4E4E7',
          silver: '#D4D4D8',
          accent: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
