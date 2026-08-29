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
        slate: {
          850: '#151f30',
          900: '#0f172a',
          950: '#080d1a',
        },
        status: {
          included: '#10B981', // Emerald
          cut: '#F43F5E',      // Rose
          dedup: '#F59E0B',    // Amber
          below: '#94A3B8',    // Crisp light slate
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
