import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        sky: "var(--sky)",
        mint: "var(--mint)",
        sand: "var(--sand)",
        paper: "var(--paper)",
        alarm: "var(--alarm)"
      },
      boxShadow: {
        card: "0 20px 40px -24px rgba(13, 41, 58, 0.35)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
