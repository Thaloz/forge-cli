import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { logger } from "./logger.js";

const SHADCN_DEPS: Record<string, string[]> = {
  feature: ["button", "input", "label"],
  auth: ["button", "input", "label"],
  storage: ["button"],
};

export type ShadcnDependencyType = keyof typeof SHADCN_DEPS;

function runCommand(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: "pipe" });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
    proc.on("error", reject);
  });
}

export async function ensureShadcnComponents(
  cwd: string,
  type: ShadcnDependencyType
): Promise<void> {
  const required = SHADCN_DEPS[type];
  if (!required || required.length === 0) return;

  const uiDir = join(cwd, "src/components/ui");

  const missing = required.filter(
    (component) => !existsSync(join(uiDir, `${component}.tsx`))
  );

  if (missing.length === 0) {
    return;
  }

  const step = logger.step(`Installing shadcn components: ${missing.join(", ")}`);

  try {
    await runCommand("npx", ["shadcn@latest", "add", ...missing, "--yes"], cwd);
    step.succeed("shadcn components installed");
  } catch {
    step.fail("Could not auto-install shadcn components");
    logger.warn(`Run manually: npx shadcn@latest add ${missing.join(" ")}`);
  }
}
