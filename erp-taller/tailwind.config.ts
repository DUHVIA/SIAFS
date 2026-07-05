import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#DB052B',
        secondary: '#1A1A1A',
        tertiary: '#747474',
        'neutral-light': '#F3F3F3',
      },
      fontFamily: {
        headline: ['var(--font-headline)'],
        body: ['var(--font-body)'],
        label: ['var(--font-label)'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.05)',
        'soft-dark': '0 4px 20px rgba(255, 255, 255, 0.02)',
      },
    },
  },
  plugins: [],
};

export default config;
