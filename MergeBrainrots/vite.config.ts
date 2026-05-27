import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  base: "./",
  server: {
    host: true,
    port: 5173,
    open: false,
  },
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: true,
    emptyOutDir: true,
  },
});
