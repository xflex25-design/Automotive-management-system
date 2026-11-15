import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/workshop/record-pages";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/quotations")({
  head: () =>
    workshopHead(
      "Quotation Management",
      "Repair quotations and customer authorizations.",
    ),
  component: () => <RecordsPage kind="quotations" />,
});
