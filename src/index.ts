import { defineCommand, runMain } from "citty";

const main = defineCommand({
  meta: {
    name: "forge",
    version: "0.1.0",
    description: "TypeScript stack scaffolding & enforcement CLI",
  },
  subCommands: {
    init: () => import("./commands/init.js").then((m) => m.default),
    "add:feature": () => import("./commands/add-feature.js").then((m) => m.default),
    check: () => import("./commands/check.js").then((m) => m.default),
  },
});

runMain(main);
