import { defineConfig } from "vite";

// On GitHub Pages this project is served from
// https://paulocorona.github.io/vibe-merge-brainrot/, so production builds
// need a matching base path. Dev keeps `/` so localhost still serves at the
// root and `import.meta.env.BASE_URL` resolves to `/` during `vite dev`.
export default defineConfig(({ command }) => ({
  root: ".",
  base: command === "build" ? "/vibe-merge-brainrot/" : "/",
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
}));
