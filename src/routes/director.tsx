import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/workshop/dashboard";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/director")({
  head: () =>
    workshopHead("Director Dashboard", "Business overview and director parts-order authorization."),
  component: () => <Dashboard role="Director" />,
});
