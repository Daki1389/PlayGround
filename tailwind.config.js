/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}', './shared/**/*.js'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#06090c',
          900: '#080c11',
          850: '#0a1016',
          800: '#0d141b',
          750: '#101821',
          700: '#151f29',
          600: '#1d2a36'
        },
        lime: {
          DEFAULT: '#c9f75c',
          300: '#e4ffa6',
          400: '#d7ff86',
          500: '#c9f75c',
          600: '#a8d63b',
          700: '#819f2c'
        },
        mist: {
          DEFAULT: '#8b9aa8',
          light: '#aebbc7',
          dim: '#5f6d7a'
        }
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'Impact', 'sans-serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        panel: '0 24px 70px -40px rgba(0,0,0,0.9)',
        lime: '0 0 30px -6px rgba(201,247,92,0.35)',
        'lime-lg': '0 10px 50px -12px rgba(201,247,92,0.45)'
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)'
      },
      backgroundSize: {
        grid: '44px 44px'
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' }
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' }
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
        'pulse-ring': 'pulseRing 1.6s ease-out infinite',
        floaty: 'floaty 4s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
