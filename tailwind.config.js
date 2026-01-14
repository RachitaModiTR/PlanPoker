/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          bg: 'var(--color-bg)', 
          surface: 'var(--color-surface)',
          text: 'var(--color-text)',
          muted: 'var(--color-muted)',
          border: 'var(--color-border)',
          
          blue: {
            DEFAULT: 'var(--color-blue-bg)',
            hover: 'var(--color-blue-hover)',
            text: 'var(--color-blue-text)',
          },
          green: {
            DEFAULT: 'var(--color-green-bg)',
            text: 'var(--color-green-text)',
          },
          red: {
            DEFAULT: 'var(--color-red-bg)',
            text: 'var(--color-red-text)',
          },
          purple: {
            DEFAULT: 'var(--color-purple-bg)',
            text: 'var(--color-purple-text)',
          }
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class', // Enable class-based dark mode
}

