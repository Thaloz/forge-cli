import { mkdir, readFile as fsReadFile, writeFile as fsWriteFile, access } from "fs/promises";
import { dirname } from "path";

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Write content to a file, creating parent directories if needed
 */
export async function writeFile(path: string, content: string): Promise<void> {
  await ensureDir(dirname(path));
  await fsWriteFile(path, content, "utf-8");
}

/**
 * Read file content as string
 */
export async function readFile(path: string): Promise<string> {
  return fsReadFile(path, "utf-8");
}
