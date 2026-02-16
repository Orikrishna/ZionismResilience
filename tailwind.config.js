/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./worth-it.html",
    "./admin-logo.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heebo: ['Heebo', 'sans-serif'],
        noto: ['Noto Sans Hebrew', 'sans-serif'],
      },
      colors: {
        // Resilience palette (unchanged)
        background: '#ECF2F8',
        card: '#FFFFFF',
        accent: '#5D87FF',
        'accent-light': '#EBF1FF',
        'accent-mid': '#49BEFF',
        'accent-pale': '#D5E3F7',
        'dark-card': '#2A3547',
        'text-main': '#2A3547',
        'text-muted': '#7C8FAC',
        'text-light': '#A1B4CE',
        'geo-north': '#4A7C6F',
        'geo-north-bg': '#E8F5F1',
        'geo-gaza': '#FA896B',
        'geo-gaza-bg': '#FFF0EB',
        'geo-golan': '#7A6E9E',
        'geo-golan-bg': '#F0EDF7',
        'geo-carmel': '#5D87FF',
        'geo-carmel-bg': '#EBF1FF',
        'geo-galil-west': '#13DEB9',
        'geo-galil-west-bg': '#E6FBF5',

        // Shaveh palette
        'sh-bg': '#f9f2f3',
        'sh-card': '#FFFFFF',
        'sh-pink': '#e8969f',
        'sh-blue': '#4263aa',
        'sh-green': '#70bdb3',
        'sh-yellow': '#e9ab56',
        'sh-pink-light': '#f8dfe2',
        'sh-green-light': '#caece9',
        'sh-yellow-light': '#fae9d1',
        'sh-text': '#454342',
        'sh-text-muted': '#706e6d',
        'sh-text-light': '#948c89',
      },
      borderRadius: {
        card: '16px',
        'card-sh': '20px',
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
