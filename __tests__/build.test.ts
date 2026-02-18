import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

describe("build output", () => {
  const distDir = resolve(process.cwd(), "dist");
  const mainFile = resolve(distDir, "index.js");

  it("dist/index.js exists after build", () => {
    expect(existsSync(mainFile)).toBe(true);
  });

  it("dist/index.js has shebang for Node", () => {
    const content = readFileSync(mainFile, "utf-8");
    expect(content).toMatch(/^#!\s*\/usr\/bin\/env node/);
  });
});
