/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f0f0f",
        surface: "#1a1a1a",
        border: "#2a2a2a",
        textPrimary: "#ededed",
        textMuted: "#888888",
        accent: "#6366f1",
      }
    },
  },
  plugins: [],
}
