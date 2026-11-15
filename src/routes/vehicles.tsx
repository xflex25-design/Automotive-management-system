import { createFileRoute } from "@tanstack/react-router";
import { VehiclesPage } from "@/components/workshop/monitor-pages";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/vehicles")({
  head: () =>
    workshopHead(
      "Vehicle Records",
      "Complete vehicle records, customer history, workshop progress and final release references.",
    ),
  component: VehiclesPage,
});
