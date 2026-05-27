import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#F8F5EF",
        altar: "#FFFFFF",
        navy: "#12355B",
        gold: "#D6A93A",
        faithGreen: "#3FA76D",
        wine: "#8A2942",
        ink: "#1F2937",
        stone: "#9CA3AF"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(18, 53, 91, 0.14)",
        card: "0 12px 34px rgba(18, 53, 91, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
