/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hit: {
          50: '#f1f6fc',
          100: '#dfeaf9',
          200: '#c0d7f2',
          300: '#92bae8',
          400: '#5d95da',
          500: '#3a77c5',
          600: '#295da6',
          700: '#0b4d8f',
          800: '#0d3f6e',
          900: '#0b3358',
        },
      },
      fontFamily: {
        sans: [
          '"Microsoft YaHei"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Source Han Sans SC"',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 3px rgba(27, 36, 48, 0.06), 0 1px 2px rgba(27, 36, 48, 0.04)',
        pop: '0 8px 28px rgba(11, 77, 143, 0.14)',
      },
    },
  },
  plugins: [],
};
