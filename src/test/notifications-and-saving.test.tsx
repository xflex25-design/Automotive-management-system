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
import { AppShell } from "@/components/workshop/app-shell";
import { WorkspaceProvider, useWorkspace } from "@/components/workshop/workspace-context";
import { appendJobCardAuditUpdate } from "@/lib/workshop";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function NotificationFlowHarness() {
  const { setVehicles, setJobs, employeeDepartment } = useWorkspace();
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    setVehicles([
      {
        id: "VR-3001",
        plate: "ZM 8822",
        make: "Toyota Hilux",
        customer: "Chanda Phiri",
        phone: "+260977112233",
        email: "chanda@example.com",
        received: "15 Nov 2026",
        stage: 5,
        department: "Mechanical",
        foreman: "Foreman 01",
        complaints: "Gearbox noise",
        damage: "None",
        due: "2026-11-20",
        progress: 60,
      },
    ]);
    setJobs([
      {
        id: "JC-901",
        vehicleId: "VR-3001",
        department: "Mechanical",
        work: "Rebuild gearbox synchros",
        status: "In Repair",
        due: "2026-11-20",
        assignedEmployee: "Peter Zulu",
      },
    ]);
  }, [setVehicles, setJobs]);

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          setJobs((prev) =>
            prev.map((j) =>
              j.id === "JC-901"
                ? appendJobCardAuditUpdate(j, {
                    status: "Completed",
                    progress: 100,
                    assignedEmployee: "Peter Zulu",
                    note: "Road test passed",
                    actor: "Peter Zulu",
                    actorRole: "Employee",
                    department: employeeDepartment,
                  })
                : j,
            ),
          )
        }
      >
        Complete JC-901
      </button>
    </div>
  );
}

describe("Browser-based job card status notifications & local persistence", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;
  const originalNotification = globalThis.Notification;

  afterEach(() => {
    globalThis.Notification = originalNotification;
    localStorage.clear();
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    container?.remove();
    container = null;
  });

  it("alerts relevant employees via Notification Center and Web Notification API on status change and persists to localStorage", async () => {
    const spawned: Array<{ title: string; body?: string }> = [];
    class MockNotification {
      static permission: NotificationPermission = "granted";
      static requestPermission = async () => "granted" as NotificationPermission;
      constructor(title: string, options?: NotificationOptions) {
        spawned.push({ title, body: options?.body });
      }
    }
    globalThis.Notification = MockNotification as unknown as typeof Notification;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const queryClient = new QueryClient();

    const rootRoute = createRootRoute({
      component: () => (
        <QueryClientProvider client={queryClient}>
          <WorkspaceProvider>
            <AppShell>
              <NotificationFlowHarness />
            </AppShell>
          </WorkspaceProvider>
        </QueryClientProvider>
      ),
    });
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: () => null,
    });
    const jobCardsRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/job-cards",
      component: () => null,
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute, jobCardsRoute]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });

    await act(async () => {
      await router.load();
      root?.render(<RouterProvider router={router} />);
    });

    // Trigger status transition from In Repair -> Completed
    const triggerBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Complete JC-901"),
    ) as HTMLButtonElement;
    expect(triggerBtn).toBeDefined();

    act(() => {
      triggerBtn.click();
    });

    // Browser Web Notification API fired
    expect(spawned).toHaveLength(1);
    expect(spawned[0]?.title).toBe("Job Card JC-901 · In Repair → Completed");
    expect(spawned[0]?.body).toContain("Mechanical team (Peter Zulu)");

    // Saved collections & notifications persisted in localStorage
    const savedJobs = JSON.parse(localStorage.getItem("hi_rider_jobs") || "[]");
    expect(savedJobs).toHaveLength(1);
    expect(savedJobs[0]?.status).toBe("Completed");
    const savedNotifs = JSON.parse(localStorage.getItem("hi_rider_notifications") || "[]");
    expect(savedNotifs).toHaveLength(1);

    // Topbar Bell shows unread count badge = 1
    const unreadBadge = container.querySelector('[data-testid="notification-unread-badge"]');
    expect(unreadBadge?.textContent).toBe("1");

    // Open Notification Center popover
    const bellBtn = container.querySelector(
      'button[aria-label*="Notifications"]',
    ) as HTMLButtonElement;
    act(() => {
      bellBtn.click();
    });

    expect(container.textContent).toContain("Job Card JC-901 · In Repair → Completed");
    expect(container.textContent).toContain("Browser alerts enabled");
    expect(container.textContent).toContain("Mechanical team (Peter Zulu)");

    // Mark read clears badge
    const markReadBtn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Mark read"),
    ) as HTMLButtonElement;
    act(() => {
      markReadBtn.click();
    });
    expect(container.querySelector('[data-testid="notification-unread-badge"]')).toBeNull();
  });
});
