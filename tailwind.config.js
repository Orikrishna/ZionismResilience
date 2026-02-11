/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heebo: ['Heebo', 'sans-serif'],
      },
      colors: {
        background: '#F4F1EB',
        card: '#FFFFFF',
        accent: '#C4714A',
        'accent-light': '#FFF3EC',
        'accent-mid': '#E8A87C',
        'accent-pale': '#F2D4B8',
        'dark-card': '#3D2B1F',
        'text-main': '#1A1008',
        'text-muted': '#8A7968',
        'text-light': '#B8A99A',
        // Geography badge colors
        'geo-north': '#4A7C6F',
        'geo-north-bg': '#EAF4F2',
        'geo-gaza': '#C4714A',
        'geo-gaza-bg': '#FFF3EC',
        'geo-golan': '#7A6E9E',
        'geo-golan-bg': '#F2F0F9',
        'geo-carmel': '#4A6E9E',
        'geo-carmel-bg': '#EEF3FA',
        'geo-galil-west': '#7A9E4A',
        'geo-galil-west-bg': '#F2F7EC',
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}
