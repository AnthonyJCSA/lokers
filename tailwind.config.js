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
        mondelez: {
          purple: '#663399',
          blue: '#0066CC',
          green: '#00AA44',
          orange: '#FF6600',
        }
      }
    },
  },
  plugins: [],
}