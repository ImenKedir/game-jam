import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        discord: {
          bg: "var(--discord-bg)",
          "bg-secondary": "var(--discord-bg-secondary)",
          "bg-tertiary": "var(--discord-bg-tertiary)",
          text: "var(--discord-text)",
          "text-muted": "var(--discord-text-muted)",
          "text-header": "var(--discord-text-header)",
          accent: "var(--discord-accent)",
          "accent-hover": "var(--discord-accent-hover)",
          danger: "var(--discord-danger)",
          border: "var(--discord-border)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
