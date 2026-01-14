import { describe, it, expect } from "vitest";
import { renderTemplate } from "../../src/utils/template.js";

describe("renderTemplate", () => {
  it("renders a template with camelCase helper", () => {
    const result = renderTemplate("feature/convex/schema.ts.hbs", { name: "user-profile" });

    expect(result).toContain("export const userProfileTables");
    expect(result).toContain("userProfile: defineTable");
  });

  it("renders a template with pascalCase helper", () => {
    const result = renderTemplate("feature/src/hooks.ts.hbs", { name: "user-profile" });

    expect(result).toContain("useUserProfileList");
    expect(result).toContain("useUserProfile");
    expect(result).toContain("useUserProfileMutations");
  });

  it("renders a template with kebabCase helper", () => {
    const result = renderTemplate("feature/routes/index.tsx.hbs", { name: "userProfile" });

    expect(result).toContain('"/user-profile/"');
  });

  it("throws error for non-existent template", () => {
    expect(() => renderTemplate("non-existent.hbs", {})).toThrow("Template not found");
  });
});
