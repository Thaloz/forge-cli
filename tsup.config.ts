import { defineConfig } from "tsup";
import { cp } from "fs/promises";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  onSuccess: async () => {
    await cp("templates", "dist/templates", { recursive: true });
  },
});
