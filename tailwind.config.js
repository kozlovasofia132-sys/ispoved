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
                secondary: 'var(--color-secondary)',
                'on-surface': 'var(--color-on-surface)',
                'surface-container-low': 'var(--color-surface-container-low)',
                'surface-container-lowest': 'var(--color-surface-container-lowest)',
                'surface-container-high': 'var(--color-surface-container-high)',
                'surface-container-highest': 'var(--color-surface-container-highest)',
                'on-surface-variant': 'var(--color-on-surface-variant)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Newsreader', 'serif'],
                headline: ['Newsreader', 'serif'],
                body: ['Lora', 'serif'],
                label: ['Plus Jakarta Sans', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
