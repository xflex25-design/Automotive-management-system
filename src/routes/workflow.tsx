import { createFileRoute } from "@tanstack/react-router";
import { WorkflowPage } from "@/components/workshop/monitor-pages";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/workflow")({
  head: () =>
    workshopHead(
      "Workflow Tracking",
      "Track all twelve official stages from vehicle intake through quotation, repairs, inspection and release.",
    ),
  component: WorkflowPage,
});
