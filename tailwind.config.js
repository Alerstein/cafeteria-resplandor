/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cafeteria: {
          dark: '#1A1A1A',
          light: '#F8F9FA',
          accent: '#FFD700', // Un amarillo tech vibrante
          brand: '#8B5A2B', // Un marrón café profundo
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
