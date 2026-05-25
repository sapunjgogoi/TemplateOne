/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "var(--bg-color)",
        cardBg: "var(--card-bg)",
        borderSlate: "var(--border-color)",
        customHeader: "var(--header-bg)",
        customInput: "var(--input-bg)",
        customEditor: "var(--editor-bg)",
        textMain: "var(--text-color)",
        textMuted: "var(--text-muted)",
        cobaltBlue: {
          light: "#60A5FA",
          DEFAULT: "#2563EB",
          dark: "#1D4ED8"
        },
        emeraldNeon: {
          light: "#34D399",
          DEFAULT: "#10B981",
          dark: "#059669"
        }
      },
      boxShadow: {
        glowCobalt: "0 0 15px rgba(37, 99, 235, 0.4)",
        glowEmerald: "0 0 15px rgba(16, 185, 129, 0.4)"
      }
    },
  },
  plugins: [],
}
