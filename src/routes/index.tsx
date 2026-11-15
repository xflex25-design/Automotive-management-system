import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/workshop/dashboard";
import { workshopHead } from "@/lib/route-head";

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () =>
    workshopHead(
      "Foreman Dashboard",
      "Hi Rider 4x4 World foreman workspace for vehicle intake, job cards, parts requisitions and inspections.",
    ),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return <Dashboard role="Foreman" />;
}
