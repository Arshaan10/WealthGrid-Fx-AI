import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "var(--bg-void)",
        ink: "var(--bg-ink)",
        panel: "var(--bg-panel)",
        gold: {
          DEFAULT: "var(--gold)",
          bright: "var(--gold-bright)",
          deep: "var(--gold-deep)",
          line: "var(--gold-line)",
          dim: "var(--gold-dim)",
        },
        cream: "var(--cream)",
        muted: "var(--muted)",
        danger: "var(--danger)",
        success: "var(--success)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 40px rgba(212, 175, 55, 0.18)",
        desk: "0 24px 80px rgba(0, 0, 0, 0.55)",
      },
      backgroundImage: {
        "gold-sheen":
          "linear-gradient(180deg, #f6e7a8 0%, #d4af37 48%, #8f7318 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
