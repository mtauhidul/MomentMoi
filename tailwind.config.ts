import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Sophisticated Teal
        primary: {
          50: '#f0f9f9',
          100: '#cceceb',
          200: '#99d8d6',
          300: '#66c4c1',
          400: '#5F9594',
          500: '#507c7b', // Main primary
          600: '#456a69',
          700: '#3a5757',
          800: '#2f4545',
          900: '#243333'
        },
        // Secondary - Warm Accent
        secondary: {
          50: '#faf9f7',
          100: '#f4f1ed',
          200: '#e8e1d9',
          300: '#dcd1c5',
          400: '#c5b8a8',
          500: '#a89d8e', // Main secondary
          600: '#8b8075',
          700: '#6e635c',
          800: '#514743',
          900: '#342a2a'
        },
        // System Colors
        background: '#f1f0ef',
        surface: '#fafafa',
        border: '#d1d5db', // gray-300
        text: {
          primary: '#212121',
          secondary: '#616161',
          muted: '#9e9e9e'
        }
      },
      fontFamily: {
        'ivy-presto': ['var(--font-ivy-presto)', 'serif'],
        'lato': ['var(--font-lato)', 'sans-serif'],
        'sans': ['var(--font-lato)', 'sans-serif'],
        'display': ['var(--font-ivy-presto)', 'serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      maxWidth: {
        '8xl': '1200px',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
