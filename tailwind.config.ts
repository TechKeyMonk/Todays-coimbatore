import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#fcfbf7', // Warm Off-White/Cream
          light: '#ffffff',
          dark: '#f8f6f0',
        },
        card: {
          DEFAULT: '#ffffff',
          cream: '#f8f6f0',
        },
        sidebar: {
          sand: '#f3ede2', // Soft Pale Sand
        },
        teal: {
          box: '#153d3b', // Deep Slate Teal
          dark: '#0d4d4d', // Logo Dark Teal
          accent: '#1f5956',
        },
        accent: {
          red: '#e54b3c', // Crimson Red
          amber: '#d9a036', // Ochre Gold/Yellow
        },
        charcoal: {
          main: '#1a1a1a', // Deep Charcoal
          muted: '#71717a', // Slate Gray
          light: '#a1a1aa',
        },
      },
      fontFamily: {
        heading: [
          'var(--font-plus-jakarta-sans)',
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        sans: [
          'var(--font-plus-jakarta-sans)',
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
        tight: '-0.02em',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        editorial: '0 4px 12px rgba(21, 61, 59, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
