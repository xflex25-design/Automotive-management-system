import { createFileRoute } from "@tanstack/react-router";
import { DepartmentsPage } from "@/components/workshop/monitor-pages";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/departments")({
  head: () =>
    workshopHead(
      "Department Performance",
      "Mechanical, panel beating, fitting, painting and sanding performance monitoring.",
    ),
  component: DepartmentsPage,
});
