import { createFileRoute } from "@tanstack/react-router";
import { IntakePage } from "@/components/workshop/intake";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/registration")({
  head: () =>
    workshopHead(
      "Vehicle Registration",
      "Customer details, vehicle intake, existing damage and intake photographs at Hi Rider 4x4 World.",
    ),
  component: IntakePage,
});
