import { defineConfig } from "vite"

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: "./index.html",
        main: "./main.html",
        end: "./end.html",
      }
    }
  }
})