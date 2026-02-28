import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  sourcemap: true,
  clean: true,
  splitting: false,
  dts: false, // CLI tool - no consumers importing as library
});
