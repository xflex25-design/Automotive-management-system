import { createFileRoute } from "@tanstack/react-router";
import { AlertsPage } from "@/components/workshop/monitor-pages";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/alerts")({
  head: () =>
    workshopHead(
      "Operational Alerts",
      "Pending authorizations, delayed vehicles and release priorities at Hi Rider 4x4 World.",
    ),
  component: AlertsPage,
});
