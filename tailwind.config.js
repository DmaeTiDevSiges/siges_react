
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'selector',
    theme: {
        extend: {
            colors: {
                "primary": "#137fec",
                "primary-dark": "#0e5eb0", // Derived/Estimated
                "background-light": "#f1f5f9",
                "background-dark": "#101922",
                "surface-dark": "#1C252E",
                "surface-light": "#FFFFFF",
                "card-dark": "#1b2531",
            },
            fontFamily: {
                "sans": ["Inter", "sans-serif"]
            }
        },
    },
    plugins: [
        require('@tailwindcss/container-queries'),
        require('@tailwindcss/forms'),
    ],
}
