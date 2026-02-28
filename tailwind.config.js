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
                "primary": "#1111d4",
                "background-light": "#f6f6f8",
                "background-dark": "#101022",
            },
            fontFamily: {
                "display": ["Lexend", "sans-serif"]
            },
            borderRadius: { "DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem" },
        },
    },
    plugins: [],
}
