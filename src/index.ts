import { defineCommand, runMain } from "citty";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const main = defineCommand({
  meta: {
    name: "forge",
    version,
    description: "TypeScript stack scaffolding & enforcement CLI",
  },
  args: {
    v: {
      type: "boolean",
      alias: ["V"],
      description: "Show version",
    },
  },
  subCommands: {
    init: () => import("./commands/init.js").then((m) => m.default),
    "add:feature": () => import("./commands/add-feature.js").then((m) => m.default),
    "add:integration": () => import("./commands/add-integration.js").then((m) => m.default),
    "add:page": () => import("./commands/add-page.js").then((m) => m.default),
    "add:layout": () => import("./commands/add-layout.js").then((m) => m.default),
    check: () => import("./commands/check.js").then((m) => m.default),
    version: () => import("./commands/version.js").then((m) => m.default),
  },
  run({ args }) {
    if (args.v) {
      console.log(version);
      return;
    }
  },
});

runMain(main);
