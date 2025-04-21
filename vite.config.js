export default {
  build: {
    rollupOptions: {
      input: {
        index: "./index.html",
        main: "./main.html",
        end: "./end.html",
      }
    }
  },
  base: "/food-ninja"
}