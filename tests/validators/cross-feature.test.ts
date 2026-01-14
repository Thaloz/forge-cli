import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { crossFeatureValidator } from "../../src/validators/cross-feature.js";

describe("crossFeatureValidator", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "forge-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("passes when there are no cross-feature imports", async () => {
    // Create feature A
    await mkdir(join(tempDir, "src/features/feature-a"), { recursive: true });
    await writeFile(
      join(tempDir, "src/features/feature-a/hooks.ts"),
      `import { useQuery } from "convex/react";
export function useFeatureA() { return useQuery(); }`
    );

    // Create feature B with no cross-feature imports
    await mkdir(join(tempDir, "src/features/feature-b"), { recursive: true });
    await writeFile(
      join(tempDir, "src/features/feature-b/hooks.ts"),
      `import { useQuery } from "convex/react";
export function useFeatureB() { return useQuery(); }`
    );

    const result = await crossFeatureValidator.validate(tempDir);

    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when there is a cross-feature import via tilde path", async () => {
    // Create feature A
    await mkdir(join(tempDir, "src/features/feature-a"), { recursive: true });
    await writeFile(
      join(tempDir, "src/features/feature-a/hooks.ts"),
      `export function useFeatureA() {}`
    );

    // Create feature B importing from feature A
    await mkdir(join(tempDir, "src/features/feature-b"), { recursive: true });
    await writeFile(
      join(tempDir, "src/features/feature-b/hooks.ts"),
      `import { useFeatureA } from "~/features/feature-a/hooks";
export function useFeatureB() { return useFeatureA(); }`
    );

    const result = await crossFeatureValidator.validate(tempDir);

    expect(result.passed).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("Cross-feature import");
    expect(result.errors[0].message).toContain("feature-b");
    expect(result.errors[0].message).toContain("feature-a");
  });

  it("allows imports within the same feature", async () => {
    // Create feature with internal imports
    await mkdir(join(tempDir, "src/features/feature-a/components"), { recursive: true });
    await writeFile(
      join(tempDir, "src/features/feature-a/components/Card.tsx"),
      `export function Card() { return <div />; }`
    );
    await writeFile(
      join(tempDir, "src/features/feature-a/index.ts"),
      `import { Card } from "~/features/feature-a/components/Card";
export { Card };`
    );

    const result = await crossFeatureValidator.validate(tempDir);

    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
