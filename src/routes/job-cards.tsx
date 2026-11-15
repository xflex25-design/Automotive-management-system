import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/workshop/record-pages";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/job-cards")({
  head: () =>
    workshopHead(
      "Job Card Management",
      "Workshop job cards, departmental assignments and repair instructions.",
    ),
  component: () => <RecordsPage kind="jobs" />,
});
