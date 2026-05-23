import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f1419",
          raised: "#151b24",
          border: "#2a3544",
        },
        accent: {
          DEFAULT: "#7ee787",
          muted: "#56d364",
        },
      },
    },
  },
  plugins: [],
};

export default config;
