/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blood: {
          red: '#8A0303',
          dark: '#5A0000',
          light: '#FFE5E5'
        }
      }
    },
  },
  plugins: [],
}