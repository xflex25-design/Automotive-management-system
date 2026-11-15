import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/components/workshop/monitor-pages";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/reports")({
  head: () =>
    workshopHead(
      "Operational Reports",
      "Workshop operations, parts orders, departmental performance and vehicle inspection reports.",
    ),
  component: ReportsPage,
});
