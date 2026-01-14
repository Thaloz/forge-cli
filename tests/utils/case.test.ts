import { describe, it, expect } from "vitest";
import { camelCase, pascalCase, kebabCase } from "../../src/utils/case.js";

describe("camelCase", () => {
  it("converts kebab-case to camelCase", () => {
    expect(camelCase("foo-bar")).toBe("fooBar");
    expect(camelCase("user-profile")).toBe("userProfile");
    expect(camelCase("my-awesome-feature")).toBe("myAwesomeFeature");
  });

  it("converts PascalCase to camelCase", () => {
    expect(camelCase("FooBar")).toBe("fooBar");
    expect(camelCase("UserProfile")).toBe("userProfile");
  });

  it("converts snake_case to camelCase", () => {
    expect(camelCase("foo_bar")).toBe("fooBar");
    expect(camelCase("user_profile")).toBe("userProfile");
  });

  it("handles already camelCase strings", () => {
    expect(camelCase("fooBar")).toBe("fooBar");
    expect(camelCase("userProfile")).toBe("userProfile");
  });

  it("handles single words", () => {
    expect(camelCase("foo")).toBe("foo");
    expect(camelCase("Foo")).toBe("foo");
  });

  it("handles spaces", () => {
    expect(camelCase("foo bar")).toBe("fooBar");
    expect(camelCase("user profile")).toBe("userProfile");
  });
});

describe("pascalCase", () => {
  it("converts kebab-case to PascalCase", () => {
    expect(pascalCase("foo-bar")).toBe("FooBar");
    expect(pascalCase("user-profile")).toBe("UserProfile");
  });

  it("converts camelCase to PascalCase", () => {
    expect(pascalCase("fooBar")).toBe("FooBar");
    expect(pascalCase("userProfile")).toBe("UserProfile");
  });

  it("handles already PascalCase strings", () => {
    expect(pascalCase("FooBar")).toBe("FooBar");
    expect(pascalCase("UserProfile")).toBe("UserProfile");
  });

  it("handles single words", () => {
    expect(pascalCase("foo")).toBe("Foo");
    expect(pascalCase("Foo")).toBe("Foo");
  });
});

describe("kebabCase", () => {
  it("converts camelCase to kebab-case", () => {
    expect(kebabCase("fooBar")).toBe("foo-bar");
    expect(kebabCase("userProfile")).toBe("user-profile");
  });

  it("converts PascalCase to kebab-case", () => {
    expect(kebabCase("FooBar")).toBe("foo-bar");
    expect(kebabCase("UserProfile")).toBe("user-profile");
  });

  it("converts snake_case to kebab-case", () => {
    expect(kebabCase("foo_bar")).toBe("foo-bar");
    expect(kebabCase("user_profile")).toBe("user-profile");
  });

  it("handles already kebab-case strings", () => {
    expect(kebabCase("foo-bar")).toBe("foo-bar");
    expect(kebabCase("user-profile")).toBe("user-profile");
  });

  it("handles single words", () => {
    expect(kebabCase("foo")).toBe("foo");
    expect(kebabCase("Foo")).toBe("foo");
  });

  it("handles spaces", () => {
    expect(kebabCase("foo bar")).toBe("foo-bar");
    expect(kebabCase("user profile")).toBe("user-profile");
  });
});
