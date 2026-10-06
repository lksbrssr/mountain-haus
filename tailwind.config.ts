import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#f6f1e7",
        sand: "#e9dec9",
        clay: "#b9a37e",
        forest: "#2f3e34",
        pine: "#44584a",
        lake: "#3f6d6a",
        ink: "#20231f",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 20px 60px -25px rgba(32, 35, 31, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
