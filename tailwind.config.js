/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        card: "0 6px 24px rgba(0,0,0,.08)",
      }
    },
  },
  plugins: [],
};
