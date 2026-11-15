import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/workshop/record-pages";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/inventory")({
  head: () =>
    workshopHead(
      "Inventory Card Management",
      "Vehicle belongings, accessories and condition inventory following customer quotation approval.",
    ),
  component: () => <RecordsPage kind="inventory" />,
});
