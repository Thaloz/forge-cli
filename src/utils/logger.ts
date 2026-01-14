import { consola } from "consola";
import pc from "picocolors";

export const logger = {
  success(msg: string) {
    consola.log(`  ${pc.green("✓")} ${msg}`);
  },

  error(msg: string) {
    consola.log(`  ${pc.red("✗")} ${msg}`);
  },

  warn(msg: string) {
    consola.log(`  ${pc.yellow("!")} ${msg}`);
  },

  info(msg: string) {
    consola.log(`  ${pc.blue("→")} ${msg}`);
  },

  log(msg: string) {
    consola.log(msg);
  },

  blank() {
    consola.log("");
  },
};
