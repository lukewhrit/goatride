/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          'ui-monospace, Menlo, Monaco,  "Cascadia Mono", "Segoe UI Mono",  "Roboto Mono",  "Oxygen Mono",  "Ubuntu Mono",  "Source Code Pro", "Fira Mono",  "Droid Sans Mono",  "Consolas", "Courier New", monospace',
          ...defaultTheme.fontFamily.mono,
        ],
      },
    },
  },
  plugins: [],
};
