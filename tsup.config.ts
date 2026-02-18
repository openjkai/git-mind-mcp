import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  sourcemap: true,
  clean: true,
  splitting: false,
  dts: false, // CLI tool - no consumers importing as library
});
