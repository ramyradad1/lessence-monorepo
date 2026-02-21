import type { Config } from "tailwindcss";

// Design tokens inlined from @lessence/ui (PostCSS can't resolve TS workspace imports)
const tokens = {
  colors: {
    primary: "#f4c025",
    background: { light: "#f8f8f5", dark: "#181611" },
    surface: { dark: "#27241b", lighter: "#393528" },
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
        "background-light": tokens.colors.background.light,
        "background-dark": tokens.colors.background.dark,
        "surface-dark": tokens.colors.surface.dark,
        "surface-lighter": tokens.colors.surface.lighter,
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
