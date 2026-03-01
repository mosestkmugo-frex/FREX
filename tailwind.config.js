/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        frex: {
          primary: '#f97316',
          secondary: '#ea580c',
          accent: '#0a0a0a',
        },
      },
    },
  },
  plugins: [],
};
