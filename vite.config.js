import { defineConfig, splitVendorChunkPlugin } from "vite";

export default defineConfig({
  server: { host: "0.0.0.0", port: 8080 },
  clearScreen: false,
  plugins: [splitVendorChunkPlugin()],
  // build: {
  //   rollupOptions: {
  //     output: {
  //       manualChunks: {
  //         phaser: ["phaser"],
  //       },
  //     },
  //   },
  // },
});
