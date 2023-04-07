/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");
module.exports = {
    darkMode: "class",
    content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                "lc-fg": "hsl(0,0%,24%)",
                "lc-fg-hover": "hsl(0,0%,26%)",
                "lc-bg": "hsl(0,0%,16%)",
                "lc-border": "hsl(0,0%,10%)",
                "lc-ez-fg": "hsl(173,100%,36%)",
                "lc-ez-bg": "hsl(171,18%,20%)",
                "lc-md-fg": "hsl(43,99%,55%)",
                "lc-md-bg": "hsl(40,26%,22%)",
                "lc-hd-fg": "hsl(348,100%,61%)",
                "lc-hd-bg": "hsl(350,25%,23%)",
                "lc-ez-fg-hover": "hsl(173,100%,46%)",
                "lc-ez-bg-hover": "hsl(171,18%,25%)",
                "lc-md-fg-hover": "hsl(43,99%,65%)",
                "lc-md-bg-hover": "hsl(40,26%,27%)",
                "lc-hd-fg-hover": "hsl(348,100%,71%)",
                "lc-hd-bg-hover": "hsl(350,25%,28%)",

                "lc-green-button": "hsl(140,61%,45%)",
                "lc-green-button-hover": "hsl(140,61%,50%)",

                "github-bg": "hsl(210, 12%, 6%)",
                "github-bg-hover": "hsl(210, 12%, 9%)",
                "google-bg": "hsl(215, 82%, 51%)",
                "google-bg-hover": "hsl(215, 82%, 56%)",
                "discord-bg": "hsl(235, 86%, 65%)",
                "discord-bg-hover": "hsl(235, 86%, 68%)",
                "twitch-bg": "hsl(264, 100%, 64%)",
                "twitch-bg-hover": "hsl(264, 100%, 68%)",

                "lc-border-light": "hsl(220,23%,97%)",
                "lc-bg-light": "hsl(0,0%,100%)",
                "lc-fg-light": "hsl(240,8%,96%)",
                "lc-fg-hover-light": "hsl(240,8%,94%)",
                "lc-fg-message-light": "hsl(240,8%,95%)",
                "lc-text-light": "hsl(0,0%,15%)",
                "lc-green-button-hover-light": "hsl(140,61%, 40%)",

                "lc-ez-fg-light": "hsl(173,97%, 35%)",
                "lc-ez-bg-light": "hsl(168, 41%, 93%)",
                "lc-ez-bg-hover-light": "hsl(168, 41%, 90%)",

                "lc-md-fg-light": "hsl(43, 100%, 50%)",
                "lc-md-bg-light": "hsl(38, 100%, 94%)",
                "lc-md-bg-hover-light": "hsl(38, 100%, 91%)",

                "lc-hd-fg-light": "hsl(349, 100%, 59%)",
                "lc-hd-bg-light": "hsl(355, 100%, 95%)",
                "lc-hd-bg-hover-light": "hsl(355, 100%, 92%)",

                "lc-fg-modal": "hsl(0,0%,100%, 11%)",
                "lc-fg-modal-hover": "hsl(0,0%,100%, 15%)",

                "lc-fg-modal-light": "hsl(180,9%,89%, 100%)",
                "lc-fg-modal-hover-light": "hsl(180,9%,85%, 100%)",
            },
            borderRadius: {
                "lc-mini": "21px",
            },
        },
    },
    plugins: [],
};
