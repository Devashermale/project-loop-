/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        card: '#161B26',
        border: '#2A3347',
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#818CF8',
        },
        secondary: {
          DEFAULT: '#A855F7',
          hover: '#9333EA',
        },
        accent: {
          DEFAULT: '#14B8A6',
          hover: '#0D9488',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        text: {
          primary: '#F3F4F6',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow': '0 0 15px rgba(99, 102, 241, 0.15)',
      }
    },
  },
  plugins: [],
}
