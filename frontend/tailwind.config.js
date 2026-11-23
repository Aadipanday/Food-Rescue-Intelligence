/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Re-map the existing emerald utility classes to the new, calmer brand palette.
        // This brings legacy dashboard components into the same visual system.
        emerald: {
          50: '#f0f5ed',
          100: '#e0ecde',
          200: '#c6dcc7',
          300: '#a1c7aa',
          400: '#79ae86',
          500: '#477d5c',
          600: '#285a42',
          700: '#214b3b',
          800: '#1b3e31',
          900: '#16352a',
          950: '#10281f',
        },
        brand: {
          50: '#f0f5ed',
          100: '#e0ecde',
          200: '#c6dcc7',
          300: '#a1c7aa',
          400: '#79ae86',
          500: '#477d5c',
          600: '#285a42',
          700: '#214b3b',
          800: '#1b3e31',
          900: '#16352a',
          950: '#10281f',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
