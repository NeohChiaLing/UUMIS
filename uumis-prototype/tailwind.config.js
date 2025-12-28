/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // Make sure this points to your Angular files
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // These match the colors in your design HTML
        "primary": "#30e87a",
        "background-light": "#f6f8f7",
        "background-dark": "#112117",
        "surface-dark": "#1a2c22",
      },
      fontFamily: {
        "display": ["Spline Sans", "sans-serif"],
        "body": ["Noto Sans", "sans-serif"],
      },
      borderRadius: {
        "lg": "2rem",
        "xl": "3rem",
      },
      // Custom Animations used in your HTML
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
