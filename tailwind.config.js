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
                bg: 'var(--color-bg)',
                surface: 'var(--color-surface)',
                border: 'var(--color-border)',
                primary: 'var(--color-primary)',
                'primary-gold': 'var(--color-primary-gold)',
                'text-main': 'var(--color-text-main)',
                'text-muted': 'var(--color-text-muted)',
                danger: 'var(--color-danger)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Lora', 'serif'],
            }
        },
    },
    plugins: [],
}
