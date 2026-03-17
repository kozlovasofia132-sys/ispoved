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
                "primary": "#7f19e6",
                "primary-dark": "#5e12ab",
                "background-light": "#f7f6f8",
                "background-dark": "#191121",
                "surface-dark": "#2a1f33",
                "text-secondary": "#ab9db8",
                "blue-accent": "#0A84FF",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            }
        },
    },
    plugins: [
        // Плагин для .sr-only (screen reader only) - необходим для работы toggle switches
        function ({ addUtilities }) {
            addUtilities({
                '.sr-only': {
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: '0',
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    borderWidth: '0',
                },
            });
        },
    ],
}
