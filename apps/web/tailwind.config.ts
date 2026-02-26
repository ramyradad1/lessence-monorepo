import type { Config } from "tailwindcss";

// 2026 Luxury Design Tokens — L'ESSENCE
const tokens = {
  colors: {
    primary: "#d4a76a",
    primaryLight: "#e8c48a",
    primaryBright: "#f0d090",
    background: {
      light: "#f5f0e8",
      DEFAULT: "#1a1710",
      subtle: "#241f16",
      dark: "#12100c",
      deep: "#0d0b08",
    },
    surface: {
      DEFAULT: "#262115",
      muted: "#302b1e",
      lighter: "#3d3628",
    },
    foreground: {
      DEFAULT: "#f5f0e8",
      muted: "#ded8cf", // Increased brightness for better readability
      faint: "#b5ad9e", // Increased brightness from #9c9489
    },
    border: "rgba(212,167,106,0.10)", // Increased from 0.06 to 0.10 for visibility
  },
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        "primary-light": tokens.colors.primaryLight,
        "primary-bright": tokens.colors.primaryBright,
        "background-light": tokens.colors.background.DEFAULT,
        "background-subtle": tokens.colors.background.subtle,
        "background-dark": tokens.colors.background.dark,
        "background-deep": tokens.colors.background.deep,
        "surface": tokens.colors.surface.DEFAULT,
        "surface-muted": tokens.colors.surface.muted,
        "surface-dark": tokens.colors.surface.muted,
        "surface-lighter": tokens.colors.surface.lighter,
        "fg": tokens.colors.foreground.DEFAULT,
        "fg-muted": tokens.colors.foreground.muted,
        "fg-faint": tokens.colors.foreground.faint,
        "warm-border": tokens.colors.border,
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "warm-sm": "0 1px 3px rgba(0,0,0,0.4)",
        "warm-md": "0 4px 20px rgba(0,0,0,0.5)",
        "warm-lg": "0 16px 48px rgba(0,0,0,0.6)",
        "warm-glow": "0 0 60px rgba(212,167,106,0.08)",
        "gold": "0 8px 32px rgba(212,167,106,0.15)",
        "gold-lg": "0 16px 48px rgba(212,167,106,0.20)",
      },
      backgroundImage: {
        "gradient-warm": "linear-gradient(135deg,#241f16 0%,#1a1710 50%,#241f16 100%)",
        "gradient-primary": "linear-gradient(135deg,#e8c48a 0%,#d4a76a 100%)",
      },
      animation: {
        "fade-in-up": "fade-in-up 0.8s cubic-bezier(0.25,0.46,0.45,0.94) both",
        "fade-in": "fade-in 0.6s ease both",
        "scale-reveal": "scale-reveal 0.7s cubic-bezier(0.25,0.46,0.45,0.94) both",
        "float": "float 4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "shimmer": "shimmer-gold 2s infinite",
      },
      keyframes: {
        "fade-in-up": {
          "from": { opacity: "0", transform: "translateY(24px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "from": { opacity: "0" },
          "to": { opacity: "1" },
        },
        "scale-reveal": {
          "from": { opacity: "0", transform: "scale(0.95)" },
          "to": { opacity: "1", transform: "scale(1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "shimmer-gold": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
