import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand colors
        brand: {
          lime: "#D4ED3A",
          teal: "#004D40",
          "lime-light": "#E6F5A3",
          "lime-dark": "#B1C62D",
          "teal-light": "#00796B",
          "teal-dark": "#00352C",
        },
        // Harkonnen-inspired colors for dark mode
        harkonnen: {
          black: "hsl(var(--harkonnen-black))",
          white: "hsl(var(--harkonnen-white))",
          red: "hsl(var(--harkonnen-red))",
          gray: "hsl(var(--harkonnen-gray))",
          "dark-gray": "hsl(var(--harkonnen-dark-gray))",
          "light-gray": "hsl(var(--harkonnen-light-gray))",
        },
        // Tier-specific colors
        grassroot: {
          primary: "hsl(var(--grassroot-primary))",
          secondary: "hsl(var(--grassroot-secondary))",
        },
        pioneer: {
          primary: "hsl(var(--pioneer-primary))",
          secondary: "hsl(var(--pioneer-secondary))",
        },
        elder: {
          primary: "hsl(var(--elder-primary))",
          secondary: "hsl(var(--elder-secondary))",
        },
        blood: {
          primary: "hsl(var(--blood-primary))",
          secondary: "hsl(var(--blood-secondary))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(212, 237, 58, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(212, 237, 58, 0.6)" },
        },
        "harkonnen-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)" },
          "50%": { boxShadow: "0 0 30px rgba(255, 255, 255, 0.2)" },
        },
        "infrared-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(255, 0, 0, 0.1)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
          "50%": {
            boxShadow: "0 0 0 4px rgba(255, 0, 0, 0.05)",
            borderColor: "rgba(255, 0, 0, 0.2)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        glow: "glow 2s ease-in-out infinite",
        "harkonnen-glow": "harkonnen-glow 3s ease-in-out infinite",
        "infrared-pulse": "infrared-pulse 2s ease-in-out infinite",
      },
      fontFamily: {
        street: ["Impact", "Arial Black", "Franklin Gothic Bold", "sans-serif"],
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      backgroundImage: {
        "harkonnen-gradient": "linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 20, 0.8) 100%)",
        "brand-gradient": "linear-gradient(135deg, rgba(212, 237, 58, 0.1) 0%, rgba(0, 77, 64, 0.05) 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
