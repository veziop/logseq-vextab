import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        plugin: "index.html",
        demo: "demo.html",
      },
    },
  },
});
