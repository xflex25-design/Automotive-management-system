import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/workshop/dashboard";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/management")({
  head: () =>
    workshopHead(
      "Management Dashboard",
      "Workshop operations, vehicle workflow, departments, delays and release oversight.",
    ),
  component: () => <Dashboard role="Management" />,
});
