/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#f4c025",
        "background-light": "#f8f8f5",
        "background-dark": "#181611",
        "surface-dark": "#27241b",
        "surface-lighter": "#393528",
      },
      fontFamily: {
        display: ["PlusJakartaSans_400Regular", "sans-serif"],
        sans: ["PlusJakartaSans_400Regular", "sans-serif"],
      },
    },
  },
  plugins: [],
}
