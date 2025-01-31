/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#10B981',
        background: '#0F172A',
        card: 'rgba(255, 255, 255, 0.1)',
        accent: '#F59E0B',
      },
      fontFamily: {
        cinzel: ['var(--font-cinzel)'],
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(1.2)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 