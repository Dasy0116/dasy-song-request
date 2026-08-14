/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', '"Noto Sans SC"', "sans-serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      colors: {
        wolf: {
          950: "#0a0716",
          900: "#0f0b1e",
          800: "#151029",
          700: "#1a1033",
          600: "#2a1d4d",
        },
        accent: {
          blue: "#4f8cff",
          violet: "#8b5cf6",
          gold: "#fbbf24",
          cyan: "#22d3ee",
        },
      },
      backgroundImage: {
        "wolf-gradient":
          "linear-gradient(135deg, #0a0716 0%, #0f0b1e 40%, #1a1033 100%)",
        "gold-glow":
          "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
        "violet-glow":
          "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f8cff 100%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(139, 92, 246, 0.4)",
        "glow-gold": "0 0 24px rgba(251, 191, 36, 0.5)",
        "glow-blue": "0 0 24px rgba(79, 140, 255, 0.5)",
      },
      animation: {
        "breathe": "breathe 4s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "twinkle": "twinkle 3s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.8s ease-out forwards",
        "fade-in": "fadeIn 1s ease-out forwards",
        "shine": "shine 2s ease-in-out infinite",
        "ripple": "ripple 0.6s linear",
        "highlight": "highlight 1.5s ease-in-out",
      },
      keyframes: {
        breathe: {
          "0%, 100%": {
            boxShadow:
              "0 0 0 0 rgba(139, 92, 246, 0.5), 0 0 40px 10px rgba(139, 92, 246, 0.2)",
          },
          "50%": {
            boxShadow:
              "0 0 0 8px rgba(139, 92, 246, 0.1), 0 0 60px 20px rgba(139, 92, 246, 0.3)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shine: {
          "0%, 100%": { backgroundPosition: "-200% 0" },
          "50%": { backgroundPosition: "200% 0" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        highlight: {
          "0%, 100%": { backgroundColor: "rgba(251, 191, 36, 0)" },
          "20%, 70%": { backgroundColor: "rgba(251, 191, 36, 0.25)" },
        },
      },
    },
  },
  plugins: [],
};
