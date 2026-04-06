/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cobalt: {
          50:  '#e8f0ff',
          100: '#c5d5ff',
          200: '#9db8ff',
          300: '#6f95ff',
          400: '#3d6fff',
          500: '#0047AB', // LPR Cobalt Blue
          600: '#003a8c',
          700: '#002d6e',
          800: '#001f50',
          900: '#001133',
        },
        lpr: {
          black: '#0a0a0a',
          dark:  '#111827',
          card:  '#1f2937',
          border:'#374151',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'evolve': 'evolve 1s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #0047AB, 0 0 10px #0047AB' },
          '100%': { boxShadow: '0 0 20px #0047AB, 0 0 40px #0047AB, 0 0 60px #0047AB' },
        },
        evolve: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
