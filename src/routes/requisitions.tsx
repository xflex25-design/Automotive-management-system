import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/workshop/record-pages";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/requisitions")({
  head: () =>
    workshopHead(
      "Parts Requisitions",
      "Required parts, quantities, request reasons and director authorization status.",
    ),
  component: () => <RecordsPage kind="requisitions" />,
});
