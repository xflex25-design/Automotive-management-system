/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkspaceProvider, useWorkspace } from "@/components/workshop/workspace-context";
import { AppShell } from "@/components/workshop/app-shell";
import { Dashboard } from "@/components/workshop/dashboard";
import { EmployeeDashboard } from "@/components/workshop/employee-dashboard";
import { OnboardingModal } from "@/components/workshop/onboarding-modal";
import { Login } from "@/components/workshop/login";
import { Toaster } from "@/components/ui/sonner";

function RoleDashboardView() {
  const { role } = useWorkspace();
  if (role === "Management") {
    return <Dashboard role="Management" />;
  }
  if (role === "Director") {
    return <Dashboard role="Director" />;
  }
  if (role === "Employee") {
    return <EmployeeDashboard />;
  }
  return <Dashboard role="Foreman" />;
}

function RoleRouterContent() {
  const { isAuthenticated } = useWorkspace();
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      <AppShell>
        <RoleDashboardView />
      </AppShell>
      <OnboardingModal />
    </>
  );
}

export function RoleRouter() {
  const [activeRole, setActiveRole] = useState<"foreman" | "manager" | "director" | "employee">(
    () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("manager") || hash.includes("management")) return "manager";
      if (hash.includes("director")) return "director";
      if (hash.includes("employee")) return "employee";
      return "foreman";
    },
  );

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("manager") || hash.includes("management")) {
        setActiveRole("manager");
      } else if (hash.includes("director")) {
        setActiveRole("director");
      } else if (hash.includes("employee")) {
        setActiveRole("employee");
      } else {
        setActiveRole("foreman");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <WorkspaceProvider>
      <RoleRouterContent />
      <Toaster />
    </WorkspaceProvider>
  );
}

export default function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <RoleRouter />
    </QueryClientProvider>
  );
}
