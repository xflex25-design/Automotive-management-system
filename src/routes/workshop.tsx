import { createFileRoute } from "@tanstack/react-router";
import { WorkshopPage } from "@/components/workshop/monitor-pages";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/workshop")({
  head: () =>
    workshopHead(
      "Workshop Progress",
      "Department repair progress recorded and coordinated by Hi Rider 4x4 World foremen.",
    ),
  component: WorkshopPage,
});
