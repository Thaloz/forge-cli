import { defineCommand } from "citty";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { version } = require(join(__dirname, "..", "package.json"));

export default defineCommand({
  meta: {
    name: "version",
    description: "Show CLI version",
  },
  run() {
    console.log(version);
  },
});
