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
        // Deep terminal background scale
        base: {
          950: "#05070d",
          900: "#080b14",
          850: "#0b0f1c",
          800: "#0f1626",
          700: "#151f34",
          600: "#1d2942",
        },
        edge: "rgba(255,255,255,0.08)",
        // Semantic signal colors
        signal: {
          green: "#22e39b",
          greenDim: "#0f6f52",
          yellow: "#f5c542",
          yellowDim: "#7a5f13",
          red: "#ff5470",
          redDim: "#7a1f31",
          blue: "#4d9dff",
          violet: "#9b7bff",
        },
        accent: {
          DEFAULT: "#22e39b",
          cyan: "#38e8e0",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        glow: "0 0 0 1px rgba(34,227,155,0.25), 0 0 24px rgba(34,227,155,0.18)",
        glowRed: "0 0 0 1px rgba(255,84,112,0.25), 0 0 24px rgba(255,84,112,0.18)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(600px circle at 50% 0%, rgba(34,227,155,0.08), transparent 60%)",
      },
      keyframes: {
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(34,227,155,0.5)" },
          "70%": { boxShadow: "0 0 0 10px rgba(34,227,155,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(34,227,155,0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        tickerScroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(-10%, -10%) rotate(0deg)", opacity: "0.55" },
          "50%": { transform: "translate(10%, 10%) rotate(12deg)", opacity: "0.9" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        spinSlow: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 2s infinite",
        shimmer: "shimmer 2s infinite",
        fadeUp: "fadeUp 0.4s ease-out both",
        ticker: "tickerScroll 40s linear infinite",
        aurora: "aurora 16s ease-in-out infinite",
        auroraSlow: "aurora 22s ease-in-out infinite",
        floatY: "floatY 6s ease-in-out infinite",
        scanline: "scanline 7s linear infinite",
        spinSlow: "spinSlow 40s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
