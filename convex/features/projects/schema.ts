import { defineTable } from "convex/server";
import { v } from "convex/values";

export const projectsTables = {
  projects: defineTable({
    // Define your fields here
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_created", ["createdAt"]),
};
