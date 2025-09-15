const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode: ['class', '[data-theme="dark"]'],
  content: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    './node_modules/flowbite/**/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans]
      },
      colors: {
        primary: {
          50: '#EBF4FF',
          100: '#D6E9FF',
          200: '#ADD3FF',
          300: '#85BDFF',
          400: '#5CA7FF',
          500: '#3E87FB',
          600: '#2670E8',
          700: '#1A5AC9',
          800: '#1547A3',
          900: '#10367D'
        }
      }
    },
    container: {
      padding: '1rem'
    }
  },
  plugins: [require('@tailwindcss/forms'), require('flowbite/plugin')]
};
