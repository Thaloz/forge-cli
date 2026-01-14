import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { thinRoutesValidator } from "../../src/validators/thin-routes.js";

describe("thinRoutesValidator", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "forge-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("passes with valid imports", async () => {
    await mkdir(join(tempDir, "app/routes"), { recursive: true });
    await writeFile(
      join(tempDir, "app/routes/index.tsx"),
      `import { createFileRoute } from "@tanstack/react-router";
import { useUserList } from "~/features/users";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { items } = useUserList();
  return <div>{items.length}</div>;
}`
    );

    const result = await thinRoutesValidator.validate(tempDir);

    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails with invalid imports", async () => {
    await mkdir(join(tempDir, "app/routes"), { recursive: true });
    await writeFile(
      join(tempDir, "app/routes/index.tsx"),
      `import { createFileRoute } from "@tanstack/react-router";
import { someUtil } from "some-random-package";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <div>{someUtil()}</div>;
}`
    );

    const result = await thinRoutesValidator.validate(tempDir);

    expect(result.passed).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain("some-random-package");
  });

  it("warns about long route files", async () => {
    await mkdir(join(tempDir, "app/routes"), { recursive: true });

    // Create a file with more than 50 lines
    const lines = Array(60)
      .fill('import { createFileRoute } from "@tanstack/react-router";')
      .join("\n");

    await writeFile(join(tempDir, "app/routes/long.tsx"), lines);

    const result = await thinRoutesValidator.validate(tempDir);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].message).toContain("exceeds 50 lines");
  });

  it("allows convex and react imports", async () => {
    await mkdir(join(tempDir, "app/routes"), { recursive: true });
    await writeFile(
      join(tempDir, "app/routes/index.tsx"),
      `import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import React from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const data = useQuery(api.users.list);
  return <div />;
}`
    );

    const result = await thinRoutesValidator.validate(tempDir);

    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
