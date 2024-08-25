/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'custom': 'inset 13px 13px 26px #949494, inset -13px -13px 26px #ffffff',
      },
    },
  },
  plugins: [],
}

