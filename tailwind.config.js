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
        sovereign: {
          50:  '#edf4ff',
          100: '#daeaff',
          200: '#bdd8ff',
          300: '#90bdff',
          400: '#5c97fc',
          500: '#3670f8',
          600: '#1f4fed',
          700: '#173cd2',
          800: '#1934aa',
          900: '#1a3086',
          950: '#141f52',
        },
        void: {
          900: '#060914',
          800: '#0b1022',
          700: '#0f1630',
          600: '#141d3e',
          500: '#1a254d',
        },
        threat: {
          critical: '#ff2d55',
          high:     '#ff6b35',
          medium:   '#ffcc00',
          low:      '#34c759',
          info:     '#5ac8fa',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        body:    ['"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'cosmos': 'radial-gradient(ellipse at 20% 50%, #1a3086 0%, #060914 50%, #0b1022 100%)',
        'grid-pattern': 'linear-gradient(rgba(54,112,248,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(54,112,248,0.05) 1px, transparent 1px)',
        'glow-blue': 'radial-gradient(circle at center, rgba(54,112,248,0.15) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':        'float 6s ease-in-out infinite',
        'glow':         'glow 2s ease-in-out infinite alternate',
        'scan-line':    'scanLine 2s linear infinite',
        'orbit':        'orbit 8s linear infinite',
        'fade-in-up':   'fadeInUp 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(54,112,248,0.3), 0 0 10px rgba(54,112,248,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(54,112,248,0.6), 0 0 40px rgba(54,112,248,0.4)' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        orbit: {
          '0%':   { transform: 'rotate(0deg) translateX(60px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(60px) rotate(-360deg)' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'sovereign': '0 0 30px rgba(54,112,248,0.3), 0 0 60px rgba(54,112,248,0.1)',
        'critical':  '0 0 20px rgba(255,45,85,0.4)',
        'safe':      '0 0 20px rgba(52,199,89,0.4)',
        'card':      '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
};
