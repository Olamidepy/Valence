import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0c0b0c",
        foreground: "#ededed",
        card: {
          DEFAULT: "#141315",
          foreground: "#ededed",
        },
        popover: {
          DEFAULT: "#141315",
          foreground: "#ededed",
        },
        primary: {
          DEFAULT: "#ef4bac",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#1e1c20",
          foreground: "#ededed",
        },
        muted: {
          DEFAULT: "#1e1c20",
          foreground: "#9e9aa4",
        },
        accent: {
          DEFAULT: "#262329",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        border: "#262429",
        input: "#262429",
        ring: "#ef4bac",
        valence: {
          purple: "#8a35b6",
          pink: "#ef4bac",
          dark: "#0c0b0c",
          surface: "#141315",
          border: "#262429",
        }
      },
      backgroundImage: {
        'valence-gradient': 'linear-gradient(135deg, #8a35b6 0%, #ef4bac 100%)',
        'valence-gradient-hover': 'linear-gradient(135deg, #993cc9 0%, #f15cb6 100%)',
        'valence-gradient-radial': 'radial-gradient(circle at top right, rgba(239, 75, 172, 0.15), transparent 50%), radial-gradient(circle at bottom left, rgba(138, 53, 182, 0.15), transparent 50%)',
      },
      fontFamily: {
        header: ["var(--font-header)", "system-ui", "sans-serif"],
        hero: ["var(--font-hero)", "DM Sans", "sans-serif"],
        body: ["var(--font-body)", "DM Sans", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
