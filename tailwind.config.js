/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx,html}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#0A84FF",
                "background-light": "#f2f2f7",
                "background-dark": "#000000",
                "blue-accent": "#0A84FF",
                "dark-bg": "#000000",
                "glass-bg": "rgba(255, 255, 255, 0.05)",
                "glass-border": "rgba(255, 255, 255, 0.1)",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            }
        },
    },
    plugins: [],
}
