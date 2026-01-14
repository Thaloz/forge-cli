/**
 * Marker-based file injection utility
 *
 * Files have designated injection points with markers:
 * ```
 * // [forge:imports]
 * import { usersTables } from "./features/users/schema";
 * // [/forge:imports]
 * ```
 *
 * User code goes OUTSIDE markers, forge code goes INSIDE.
 */

export interface MarkerResult {
  success: boolean;
  content: string;
  alreadyPresent?: boolean;
}

/**
 * Insert content at a marker position
 * @param content - The file content
 * @param marker - The marker name (e.g., "imports", "tables")
 * @param insertion - The content to insert
 * @param commentStyle - The comment style ("ts" for //, "jsx" for JSX comments)
 */
export function insertAtMarker(
  content: string,
  marker: string,
  insertion: string,
  commentStyle: "ts" | "jsx" = "ts"
): MarkerResult {
  const startMarker =
    commentStyle === "ts"
      ? `// [forge:${marker}]`
      : `{/* [forge:${marker}] */}`;
  const endMarker =
    commentStyle === "ts"
      ? `// [/forge:${marker}]`
      : `{/* [/forge:${marker}] */}`;

  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    return { success: false, content };
  }

  // Check if already present (prevent duplicates)
  const markerContent = content.slice(startIdx, endIdx);
  if (markerContent.includes(insertion.trim())) {
    return { success: true, content, alreadyPresent: true };
  }

  // Insert before end marker
  const before = content.slice(0, endIdx);
  const after = content.slice(endIdx);

  return {
    success: true,
    content: `${before}${insertion}\n${after}`,
  };
}

/**
 * Replace content between markers entirely
 * @param content - The file content
 * @param marker - The marker name
 * @param replacement - The new content between markers
 * @param commentStyle - The comment style
 */
export function replaceAtMarker(
  content: string,
  marker: string,
  replacement: string,
  commentStyle: "ts" | "jsx" = "ts"
): MarkerResult {
  const startMarker =
    commentStyle === "ts"
      ? `// [forge:${marker}]`
      : `{/* [forge:${marker}] */}`;
  const endMarker =
    commentStyle === "ts"
      ? `// [/forge:${marker}]`
      : `{/* [/forge:${marker}] */}`;

  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    return { success: false, content };
  }

  const before = content.slice(0, startIdx + startMarker.length);
  const after = content.slice(endIdx);

  return {
    success: true,
    content: `${before}\n${replacement}\n${after}`,
  };
}

/**
 * Check if markers exist in content
 */
export function hasMarkers(
  content: string,
  marker: string,
  commentStyle: "ts" | "jsx" = "ts"
): boolean {
  const startMarker =
    commentStyle === "ts"
      ? `// [forge:${marker}]`
      : `{/* [forge:${marker}] */}`;
  const endMarker =
    commentStyle === "ts"
      ? `// [/forge:${marker}]`
      : `{/* [/forge:${marker}] */}`;

  return content.includes(startMarker) && content.includes(endMarker);
}
