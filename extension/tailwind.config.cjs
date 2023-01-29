/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");
module.exports = {
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
            },
            borderRadius: {
                "lc-mini": "21px",
            },
        },
    },
    plugins: [],
};
