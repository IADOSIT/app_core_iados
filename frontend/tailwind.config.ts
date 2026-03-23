import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00E676',
          50: '#E8FFF3',
          100: '#B9F6CA',
          200: '#69F0AE',
          300: '#00E676',
          400: '#00C853',
          500: '#00C853',
          600: '#009624',
          700: '#00895a',
          800: '#006633',
          900: '#004422',
        },
        dark: {
          DEFAULT: '#0A0A0F',
          50: '#1A1A24',
          100: '#14141C',
          200: '#111118',
          300: '#0D0D14',
          400: '#0A0A0F',
        },
        surface: {
          DEFAULT: '#1A1A24',
          hover: '#1E1E2A',
          border: 'rgba(0, 230, 118, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00E676 0%, #00C853 50%, #009624 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0A0A0F 0%, #111118 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(26,26,36,0.9) 0%, rgba(14,14,20,0.95) 100%)',
        'gradient-glow': 'radial-gradient(ellipse at center, rgba(0,230,118,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 230, 118, 0.3)',
        'glow-sm': '0 0 10px rgba(0, 230, 118, 0.2)',
        'glow-lg': '0 0 40px rgba(0, 230, 118, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 230, 118, 0.15)',
      },
      animation: {
        'pulse-green': 'pulseGreen 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGreen: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
