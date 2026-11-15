import { createFileRoute } from "@tanstack/react-router";
import { ApprovalPage } from "@/components/workshop/monitor-pages";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/approvals")({
  head: () =>
    workshopHead(
      "Parts Approval Screen",
      "Director review, approval and rejection of workshop parts requisitions before procurement.",
    ),
  component: ApprovalPage,
});
