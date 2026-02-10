import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import istanbul from "vite-plugin-istanbul";

export default defineConfig({
  plugins: [
    istanbul({
      include: "src/**/*.{js,jsx,ts,tsx}",
      exclude: ["node_modules", "test/", "**/*.spec.ts", "**/*.spec.tsx"],
      extension: [".js", ".jsx", ".ts", ".tsx"],
      requireEnv: false,
      forceBuildInstrument: true,
      nycOptions: {
        all: true,
        include: ["src/**/*.{js,jsx,ts,tsx}"],
        exclude: ["node_modules/**", "test/**"],
        reporter: ["html", "text", "json"],
      },
    }),
    react(),
  ],
});
