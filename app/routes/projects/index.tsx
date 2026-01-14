import { createFileRoute } from "@tanstack/react-router";
import { useProjectsList } from "~/features/projects";

export const Route = createFileRoute("/projects/")({
  component: ProjectsIndexRoute,
});

function ProjectsIndexRoute() {
  const { items, isLoading } = useProjectsList();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Projects</h1>
      {/* Build your UI here */}
    </div>
  );
}
