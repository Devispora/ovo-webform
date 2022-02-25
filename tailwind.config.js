module.exports = {
    content: ["./app/**/*.{ts,tsx,jsx,js}"],
    theme: {
        extend: {},
    },
    variants: {},
    plugins: [require("@tailwindcss/forms"), require("daisyui")],
    daisyui: {
        themes: ["light", "dark"],
    },
};
