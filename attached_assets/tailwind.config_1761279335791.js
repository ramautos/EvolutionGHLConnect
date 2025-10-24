/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          600: '#667eea',
          700: '#5568d3',
          900: '#764ba2',
        },
        green: {
          600: '#25d366',
          700: '#1ea952',
        },
      },
    },
  },
  plugins: [],
}
