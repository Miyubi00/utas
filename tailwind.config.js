/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        krem: '#F0F1E9',
        kertas: '#FBFAF5',
        'coklat-tua': '#2E342E',
        'coklat-sedang': '#596657',
        terracotta: '#4F674F',
        lumut: '#4F674F',
        garis: '#D3D9CF',
      },
      fontFamily: {
        playfair: ['Cormorant Garamond', 'Georgia', 'serif'],
        lora: ['Lora', 'Georgia', 'serif'],
        reading: ['Lora', 'Georgia', 'serif'],
        caveat: ['Lora', 'Georgia', 'serif'],
        elite: ['Lora', 'Georgia', 'serif'],
      },
      boxShadow: {
        'journal': '0 2px 4px rgba(39, 47, 39, .025), 0 12px 30px -22px rgba(39, 47, 39, .24)',
        'journal-lg': '0 14px 36px -24px rgba(39, 47, 39, .32), 0 3px 8px rgba(39, 47, 39, .06)',
        'polaroid': '0 6px 20px -2px rgba(39, 47, 39, .2), 0 2px 8px -1px rgba(39, 47, 39, .12)',
      },
    },
  },
  plugins: [],
};
