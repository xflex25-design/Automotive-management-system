import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/workshop/record-pages";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/inspections")({
  head: () =>
    workshopHead(
      "Vehicle Inspections",
      "Foreman inspection results, completion information and workshop sign-off.",
    ),
  component: () => <RecordsPage kind="inspections" />,
});
