import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDashboard } from "@/components/workshop/employee-dashboard";
import { workshopHead } from "@/lib/route-head";
export const Route = createFileRoute("/employee")({
  head: () =>
    workshopHead(
      "Employee Dashboard",
      "Department employee portal for tracking task progress and requisitions.",
    ),
  component: EmployeeDashboard,
});
