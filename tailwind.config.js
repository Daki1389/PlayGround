/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          975: '#050b08',
          950: '#07100c',
          900: '#091510',
          850: '#0b1a14',
          800: '#0e2019',
          750: '#11271e',
          700: '#163126',
          600: '#1d4032',
          500: '#2a5442',
        },
        lime: {
          300: '#d7ff8a',
          400: '#c6f56d',
          500: '#b5ea50',
          600: '#97ce33',
        },
        mist: {
          50: '#f2f8f4',
          100: '#e5efe8',
          200: '#c8d8ce',
          300: '#a2b9ab',
          400: '#7e988a',
          500: '#60796c',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Space Grotesk"', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 24px 60px -30px rgba(0,0,0,0.85)',
        glow: '0 0 40px -8px rgba(198,245,109,0.35)',
        'inner-line': 'inset 0 1px 0 rgba(255,255,255,0.045)',
      },
      backgroundImage: {
        'pitch-lines': 'repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 80px)',
      },
      animation: {
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'rise': 'rise .45s cubic-bezier(.2,.8,.2,1) both',
        'slide-in': 'slideIn .35s cubic-bezier(.2,.8,.2,1) both',
        'shimmer': 'shimmer 2.4s linear infinite',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.45' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
