/**
 * Convert a string to camelCase
 * @example "foo-bar" → "fooBar"
 * @example "FooBar" → "fooBar"
 * @example "foo_bar" → "fooBar"
 */
export function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

/**
 * Convert a string to PascalCase
 * @example "foo-bar" → "FooBar"
 * @example "fooBar" → "FooBar"
 * @example "foo_bar" → "FooBar"
 */
export function pascalCase(str: string): string {
  const camel = camelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Convert a string to kebab-case
 * @example "fooBar" → "foo-bar"
 * @example "FooBar" → "foo-bar"
 * @example "foo_bar" → "foo-bar"
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}
