import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { featureStructureValidator } from "../../src/validators/feature-structure.js";

describe("featureStructureValidator", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "forge-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("passes when all required files exist", async () => {
    // Create valid src feature
    await mkdir(join(tempDir, "src/features/users/components"), { recursive: true });
    await writeFile(join(tempDir, "src/features/users/components/index.ts"), "");
    await writeFile(join(tempDir, "src/features/users/hooks.ts"), "");
    await writeFile(join(tempDir, "src/features/users/index.ts"), "");

    // Create valid convex feature
    await mkdir(join(tempDir, "convex/features/users"), { recursive: true });
    await writeFile(join(tempDir, "convex/features/users/schema.ts"), "");
    await writeFile(join(tempDir, "convex/features/users/queries.ts"), "");
    await writeFile(join(tempDir, "convex/features/users/mutations.ts"), "");
    await writeFile(join(tempDir, "convex/features/users/index.ts"), "");

    const result = await featureStructureValidator.validate(tempDir);

    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when src feature is missing required files", async () => {
    // Create incomplete src feature (missing hooks.ts)
    await mkdir(join(tempDir, "src/features/users/components"), { recursive: true });
    await writeFile(join(tempDir, "src/features/users/components/index.ts"), "");
    await writeFile(join(tempDir, "src/features/users/index.ts"), "");
    // Missing: hooks.ts

    const result = await featureStructureValidator.validate(tempDir);

    expect(result.passed).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.file.includes("hooks.ts"))).toBe(true);
  });

  it("fails when convex feature is missing required files", async () => {
    // Create incomplete convex feature (missing mutations.ts)
    await mkdir(join(tempDir, "convex/features/users"), { recursive: true });
    await writeFile(join(tempDir, "convex/features/users/schema.ts"), "");
    await writeFile(join(tempDir, "convex/features/users/queries.ts"), "");
    await writeFile(join(tempDir, "convex/features/users/index.ts"), "");
    // Missing: mutations.ts

    const result = await featureStructureValidator.validate(tempDir);

    expect(result.passed).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.file.includes("mutations.ts"))).toBe(true);
  });

  it("passes with no features", async () => {
    // Empty project
    await mkdir(join(tempDir, "src/features"), { recursive: true });
    await mkdir(join(tempDir, "convex/features"), { recursive: true });

    const result = await featureStructureValidator.validate(tempDir);

    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
