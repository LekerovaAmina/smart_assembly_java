/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B00',
        'primary-hover': '#E55F00',
        surface: '#FFFFFF',
        bg: '#F5F5F5',
        sidebar: '#FFFFFF',
        border: '#E8E8E8',
        text: {
          primary: '#1A1A1A',
          secondary: '#666666',
          muted: '#999999',
        },
        badge: {
          'volunteer-bg': '#FFF3E0',
          'volunteer-text': '#E65100',
          'conference-bg': '#E3F2FD',
          'conference-text': '#1565C0',
          'roundtable-bg': '#F3E5F5',
          'roundtable-text': '#6A1B9A',
        },
        status: {
          active: '#4CAF50',
          inactive: '#9E9E9E',
          going: '#FF6B00',
          done: '#9E9E9E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        badge: '6px',
      },
    },
  },
  plugins: [],
};
