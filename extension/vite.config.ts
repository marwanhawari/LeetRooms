import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    root: "src",
    publicDir: "public",
    build: {
        outDir: "../dist",
        rollupOptions: {
            input: {
                content: "./src/content.ts",
                panel: "./src/panel.ts",
                index: "./src/index.html",
            },
            output: {
                entryFileNames: (assetInfo) => {
                    return assetInfo.name === "content" ||
                        assetInfo.name === "panel"
                        ? "[name].js"
                        : "assets/[name].js";
                },
                assetFileNames: "assets/[name][extname]",
            },
        },
    },
    base: "./",
});
