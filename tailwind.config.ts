import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#070E1A",
          900: "#0D1B2A",
          800: "#14253A",
          700: "#1E3A5F",
          600: "#2D5A8A",
        },
        blue: {
          accent: "#4A90D9",
          light: "#7BB3E8",
          muted: "#5B8DB8",
        },
        cream: {
          100: "#F0F4F8",
          200: "#D1DCE8",
          300: "#8FA4BC",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
