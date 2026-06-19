import type { Config } from "tailwindcss";
import { designSystem } from "./src/styles/design-system";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: designSystem.colors,
      fontFamily: designSystem.typography.fontFamilies,
      spacing: designSystem.spacing,
      borderRadius: {
        ...designSystem.borderRadius,
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        ...designSystem.shadows,
        'glow':        '0 0 24px rgba(255, 107, 0, 0.22)',
        'glow-lg':     '0 0 48px rgba(255, 107, 0, 0.18)',
        'card':        '0 4px 24px -4px rgba(27, 28, 28, 0.08)',
        'card-hover':  '0 20px 60px -8px rgba(255, 107, 0, 0.18)',
        'lift':        '0 24px 64px -12px rgba(27, 28, 28, 0.14)',
        'warm':        '0 8px 32px -8px rgba(255, 107, 0, 0.10)',
        'orange-btn':  '0 6px 20px rgba(255, 107, 0, 0.32)',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        'gradient-warm':   'linear-gradient(135deg, #fff8f5 0%, #fdfaf7 100%)',
        'gradient-orange': 'linear-gradient(135deg, #ff6b00 0%, #ff9340 100%)',
        'gradient-gold':   'linear-gradient(135deg, #ff9f1c 0%, #ffcc02 100%)',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':      { transform: 'translateY(-6px) rotate(1deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 107, 0, 0)' },
          '50%':      { boxShadow: '0 0 24px 8px rgba(255, 107, 0, 0.14)' },
        },
        'shimmer-sweep': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(250%)' },
        },
        'heart-pop': {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.45)' },
          '70%':  { transform: 'scale(0.88)' },
          '100%': { transform: 'scale(1)' },
        },
        'bounce-in': {
          '0%':   { opacity: '0', transform: 'scale(0.3)' },
          '50%':  { transform: 'scale(1.1)' },
          '70%':  { transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up-fade': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'float':          'float 3s ease-in-out infinite',
        'float-slow':     'float-slow 4s ease-in-out infinite',
        'pulse-glow':     'pulse-glow 2.5s ease-in-out infinite',
        'shimmer-sweep':  'shimmer-sweep 0.9s ease-in-out',
        'heart-pop':      'heart-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in':      'bounce-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up-fade':  'slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in':       'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'spin-slow':      'spin-slow 10s linear infinite',
      },
      transitionTimingFunction: {
        'spring':     'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
export default config;
