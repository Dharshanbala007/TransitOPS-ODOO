/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0b1220',
          navy: '#121a2b',
          card: 'rgba(18, 26, 43, 0.6)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-active': 'rgba(99, 102, 241, 0.4)',
        },
        accent: {
          indigo: '#6366f1',
          cyan: '#06b6d4',
        },
        status: {
          available: {
            text: '#34d399',
            bg: 'rgba(52, 211, 153, 0.1)',
            border: 'rgba(52, 211, 153, 0.2)',
            glow: 'rgba(52, 211, 153, 0.15)'
          },
          ontrip: {
            text: '#60a5fa',
            bg: 'rgba(96, 165, 250, 0.1)',
            border: 'rgba(96, 165, 250, 0.2)',
            glow: 'rgba(96, 165, 250, 0.15)'
          },
          inshop: {
            text: '#fbbf24',
            bg: 'rgba(251, 191, 36, 0.1)',
            border: 'rgba(251, 191, 36, 0.2)',
            glow: 'rgba(251, 191, 36, 0.15)'
          },
          suspended: {
            text: '#f87171',
            bg: 'rgba(248, 113, 113, 0.1)',
            border: 'rgba(248, 113, 113, 0.2)',
            glow: 'rgba(248, 113, 113, 0.15)'
          },
          offduty: {
            text: '#9ca3af',
            bg: 'rgba(156, 163, 175, 0.1)',
            border: 'rgba(156, 163, 175, 0.2)',
            glow: 'rgba(156, 163, 175, 0.15)'
          },
          retired: {
            text: '#d1d5db',
            bg: 'rgba(75, 85, 99, 0.2)',
            border: 'rgba(75, 85, 99, 0.3)',
            glow: 'rgba(75, 85, 99, 0.1)'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'Sora', 'sans-serif'],
      },
      borderRadius: {
        'glass-card': '20px',
      },
      boxShadow: {
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 0 15px rgba(99, 102, 241, 0.15)',
        'accent-glow': '0 0 20px rgba(6, 182, 212, 0.3)',
      },
      backdropBlur: {
        'glass': '16px',
      }
    },
  },
  plugins: [],
}
