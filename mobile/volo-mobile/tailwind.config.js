/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // VOLO Brand Palette
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdbb74',
          400: '#fb923c',
          500: '#ff7a00',   // primary brand orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          blue: '#0a58ca',   // secondary brand blue
          green: '#5cbf2a',  // secondary brand green
        },
        worker: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0a58ca',   // primary brand blue
          600: '#0950b8',
          700: '#073f91',
          800: '#052c66',
          900: '#031b3d',
        },
        surface: {
          DEFAULT: '#0F172A',  // dark bg
          card:    '#1E293B',
          border:  '#334155',
          muted:   '#475569',
        },
        accent: {
          green:  '#5cbf2a',   // official logo green
          red:    '#EF4444',
          amber:  '#F59E0B',
          blue:   '#0a58ca',   // official logo blue
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
