/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          light: '#25D366',
          DEFAULT: '#128C7E',
          dark: '#075E54',
          chatbg: '#EFEAE2',
          bubbleOut: '#D9FDD3',
          bubbleIn: '#FFFFFF',
          teal: '#008069',
        },
      },
    },
  },
  plugins: [],
};

