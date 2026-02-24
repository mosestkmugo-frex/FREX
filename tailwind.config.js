/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        frex: {
          primary: '#0f766e',
          secondary: '#0d9488',
          accent: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};
