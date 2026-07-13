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
        // ── Matrix terminal background scale — pure black → phosphor-tinted panels
        base: {
          950: "#000000",
          900: "#010401",
          850: "#020a05",
          800: "#04150a",
          700: "#072112",
          600: "#0b3319",
        },
        edge: "rgba(0,255,65,0.12)",
        // ── Semantic signal colors (kept the same token names so the whole app reskins)
        signal: {
          green: "#00ff41", // Matrix neon green
          greenDim: "#0a7a2f",
          yellow: "#ffcf3a", // gold — AI confidence
          yellowDim: "#7a5f13",
          red: "#ff2957", // deep critical red
          redDim: "#7a1f31",
          blue: "#22d3ff", // holographic blue
          violet: "#b26bff", // purple
        },
        accent: {
          DEFAULT: "#00ff41",
          cyan: "#00ffe0", // electric cyan
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glass:
          "0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(0,255,65,0.08), 0 0 0 1px rgba(0,255,65,0.06)",
        glow: "0 0 0 1px rgba(0,255,65,0.35), 0 0 22px rgba(0,255,65,0.25)",
        glowRed: "0 0 0 1px rgba(255,41,87,0.35), 0 0 22px rgba(255,41,87,0.25)",
        glowCyan: "0 0 0 1px rgba(0,255,224,0.3), 0 0 22px rgba(0,255,224,0.22)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(0,255,65,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.05) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(600px circle at 50% 0%, rgba(0,255,65,0.10), transparent 60%)",
        scanlines:
          "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.28) 3px, rgba(0,0,0,0) 4px)",
      },
      keyframes: {
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(0,255,65,0.5)" },
          "70%": { boxShadow: "0 0 0 10px rgba(0,255,65,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(0,255,65,0)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        tickerScroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(-10%, -10%) rotate(0deg)", opacity: "0.4" },
          "50%": { transform: "translate(10%, 10%) rotate(12deg)", opacity: "0.7" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        spinSlow: { to: { transform: "rotate(360deg)" } },
        // ── hacker-theme additions
        flicker: {
          "0%, 19%, 21%, 55%, 57%, 100%": { opacity: "1" },
          "20%, 56%": { opacity: "0.72" },
          "22%, 24%": { opacity: "0.88" },
        },
        textFlicker: {
          "0%, 100%": { opacity: "1", textShadow: "0 0 8px rgba(0,255,65,0.55)" },
          "45%": { opacity: "0.85", textShadow: "0 0 3px rgba(0,255,65,0.35)" },
          "50%": { opacity: "1", textShadow: "0 0 14px rgba(0,255,65,0.8)" },
        },
        blink: { "0%, 49%": { opacity: "1" }, "50%, 100%": { opacity: "0" } },
        glitchShift: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 1px)" },
          "40%": { transform: "translate(2px, -1px)" },
          "60%": { transform: "translate(-1px, -1px)" },
          "80%": { transform: "translate(1px, 1px)" },
        },
        borderFlow: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        hologram: {
          "0%, 100%": { opacity: "0.85", filter: "hue-rotate(0deg)" },
          "50%": { opacity: "1", filter: "hue-rotate(12deg)" },
        },
        dataDown: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%, 90%": { opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        bootBar: { "0%": { width: "0%" }, "100%": { width: "100%" } },
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
        flicker: "flicker 4s infinite",
        textFlicker: "textFlicker 5s infinite",
        blink: "blink 1.1s step-end infinite",
        glitchShift: "glitchShift 0.4s infinite",
        borderFlow: "borderFlow 4s ease infinite",
        hologram: "hologram 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
