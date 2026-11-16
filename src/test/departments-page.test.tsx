import { act, useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it } from "vitest";
import { DepartmentsPage } from "@/components/workshop/monitor-pages";
import { WorkspaceProvider, useWorkspace } from "@/components/workshop/workspace-context";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function DepartmentsHarness({ seedJob }: { seedJob: boolean }) {
  const { setVehicles, setJobs } = useWorkspace();
  const seededRef = useRef(false);

  useEffect(() => {
    if (!seedJob || seededRef.current) return;
    seededRef.current = true;
    setVehicles([
      {
        id: "VR-2001",
        plate: "ZM 9012",
        make: "Ford Ranger",
        customer: "Lombe Chanda",
        phone: "+260977000111",
        email: "lombe@example.com",
        received: "15 Nov 2026",
        stage: 5,
        department: "Mechanical",
        foreman: "Foreman 01",
        complaints: "Clutch slip",
        damage: "None",
        due: "2026-11-22",
        progress: 30,
      },
    ]);
    setJobs([
      {
        id: "JC-2001",
        vehicleId: "VR-2001",
        department: "Mechanical",
        work: "Inspect clutch assembly",
        status: "In progress",
        due: "2026-11-22",
      },
    ]);
  }, [seedJob, setVehicles, setJobs]);

  return <DepartmentsPage />;
}

async function mountDepartmentsPage(seedJob: boolean) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const queryClient = new QueryClient();

  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <WorkspaceProvider>
          <DepartmentsHarness seedJob={seedJob} />
        </WorkspaceProvider>
      </QueryClientProvider>
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  });
  const departmentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/departments",
    component: () => null,
  });
  const jobCardsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/job-cards",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, departmentsRoute, jobCardsRoute]),
    history: createMemoryHistory({ initialEntries: ["/departments"] }),
  });

  await act(async () => {
    await router.load();
    root.render(<RouterProvider router={router} />);
  });

  return { container, root };
}

describe("DepartmentsPage Department overview section", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    container?.remove();
    container = null;
  });

  it("shows empty state with no sample metrics until foremen record work", async () => {
    ({ container, root } = await mountDepartmentsPage(false));

    expect(container.textContent).toContain("Department overview");
    expect(container.textContent).toContain("Work coordinated and recorded by the foremen");
    expect(container.textContent).toContain("No department metrics yet");
    expect(container.textContent).not.toContain("82%");
    expect(container.textContent).not.toContain("74%");
    expect(container.textContent).not.toContain("91%");
  });

  it("populates Department overview from recorded job cards once work begins", async () => {
    ({ container, root } = await mountDepartmentsPage(true));

    expect(container.textContent).not.toContain("No department metrics yet");
    expect(container.textContent).toContain("Mechanical");
    expect(container.textContent).toContain("Inspect clutch assembly");
    expect(container.textContent).toContain("0%");
  });
});
