/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f8d2d9',
          300: '#f1adba',
          400: '#e57a92',
          500: '#d24d6d',
          600: '#b83454',
          700: '#9b2440',
          800: '#801b33',
          900: '#6b1a2e',
          950: '#430917',
        },
        gov: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f8d2d9',
          500: '#9b2440',
          600: '#801b33',
          700: '#6b1a2e',
          800: '#521021',
          900: '#3d0816',
        },
        india: {
          saffron: '#FF9933',
          navy: '#000080',
          green: '#138808',
          gold: '#D97706',
        }
      }
    },
  },
  plugins: [],
}
