import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export function useProjectsList() {
  const items = useQuery(api.features.projects.queries.list);

  return {
    items: items ?? [],
    isLoading: items === undefined,
  };
}

export function useProjects(id: Id<"projects">) {
  const item = useQuery(api.features.projects.queries.getById, { id });

  return {
    item,
    isLoading: item === undefined,
  };
}

export function useProjectsMutations() {
  const create = useMutation(api.features.projects.mutations.create);
  const update = useMutation(api.features.projects.mutations.update);
  const remove = useMutation(api.features.projects.mutations.remove);

  return { create, update, remove };
}
