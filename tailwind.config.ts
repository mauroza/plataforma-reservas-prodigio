import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colors extracted from Prodigio brand manual PDF
        brand: {
          'green-deep':   '#003224',
          'green-dark':   '#013223',
          'green-medium': '#2d2d32',
          'green-warm':   '#24433b',
          'green-sage':   '#95be9a',
          'cream-pale':   '#dddbcc',
          'cream-warm':   '#e8e5dc',
          'cream-taupe':  '#c0bdad',
          'cream-gold':   '#ccc79f',
          'wine':         '#522b38',
          'coral':        '#cf5f56',
          'peach':        '#d0a49b',
        },
      },
      fontFamily: {
        sans:    ['var(--font-inter)',      'system-ui', 'sans-serif'],
        serif:   ['var(--font-cormorant)', 'Georgia',   'serif'],
        script:  ['var(--font-great-vibes)','cursive'],
        display: ['var(--font-cinzel)',    'Georgia',   'serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0c0c0d 0%, #003224 50%, #2d2d32 100%)',
        'gradient-card':  'linear-gradient(145deg, #19191c 0%, #19191c 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

export default config
