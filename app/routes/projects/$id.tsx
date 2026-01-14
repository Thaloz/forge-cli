import { createFileRoute } from "@tanstack/react-router";
import { useProjects } from "~/features/projects";
import type { Id } from "@convex/_generated/dataModel";

export const Route = createFileRoute("/projects/$id")({
  component: ProjectsDetailRoute,
});

function ProjectsDetailRoute() {
  const { id } = Route.useParams();
  const { item, isLoading } = useProjects(id as Id<"projects">);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!item) {
    return <div>Not found</div>;
  }

  return (
    <div>
      <h1>Projects Detail</h1>
      {/* Build your UI here */}
    </div>
  );
}
