import { createFileRoute } from "@tanstack/react-router";
import { ProcurementPage } from "@/components/workshop/monitor-pages";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/procurement")({
  head: () =>
    workshopHead(
      "Procurement and Dispatch",
      "Purchasing authorized parts and recording their dispatch to workshop departments.",
    ),
  component: ProcurementPage,
});
