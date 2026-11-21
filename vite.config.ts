import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()], base: "/maqna-hive-office/", build: { sourcemap: false } });
