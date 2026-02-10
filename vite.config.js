import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import istanbulPlugin from "vite-plugin-istanbul";

export default defineConfig({
  build: { sourcemap: true },
  plugins: [
    react(),
    istanbulPlugin({
      include: ["src/**/*"],
      exclude: ["node_modules"],
      requireEnv: false,
    }),
  ],
  base: "/",
});
