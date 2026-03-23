/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#006837', // ACETEL Green
                secondary: '#ffffff', // White
                accent: '#f59e0b', // Amber/Gold
            },
        },
    },
    plugins: [],
}
