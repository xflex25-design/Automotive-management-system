import { act, useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";
import { JobCardDetailDialog } from "@/components/workshop/job-card-detail";
import { WorkspaceProvider, useWorkspace } from "@/components/workshop/workspace-context";
import { createJobCardAuditEntry } from "@/lib/workshop";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function JobCardAuditHarness({ initialTab = "overview" }: { initialTab?: "overview" | "audit" }) {
  const { setVehicles, setJobs } = useWorkspace();
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    setVehicles([
      {
        id: "VR-1068",
        plate: "BCA 4821",
        make: "Toyota Hilux",
        customer: "John Mwansa",
        phone: "+260977111111",
        email: "john@example.com",
        received: "15 Nov 2026",
        stage: 5,
        department: "Mechanical",
        foreman: "Foreman 01",
        complaints: "Brake squeal",
        damage: "None",
        due: "20 Nov 2026",
        progress: 25,
      },
    ]);
    setJobs([
      {
        id: "JC-900",
        vehicleId: "VR-1068",
        department: "Mechanical",
        work: "Inspect brake calipers and suspension bushings",
        status: "Pending",
        due: "2026-11-20",
        remarks: "Initial foreman check",
        preparedBy: "Foreman 01",
        auditTrail: [
          createJobCardAuditEntry({
            type: "created",
            actor: "Foreman 01",
            actorRole: "Foreman",
            summary: "Job card JC-900 created for Mechanical",
            newStatus: "Pending",
            department: "Mechanical",
            note: "Initial foreman check",
            recordedAtMs: 1000,
            timestamp: "15 Nov 2026, 08:00",
          }),
        ],
      },
    ]);
  }, [setVehicles, setJobs]);

  return <JobCardDetailDialog jobId="JC-900" initialTab={initialTab} onClose={() => undefined} />;
}

describe("JobCardDetailDialog Audit Trail tab", () => {
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

  function mount(node: React.ReactElement) {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const queryClient = new QueryClient();
    act(() => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <WorkspaceProvider>{node}</WorkspaceProvider>
        </QueryClientProvider>,
      );
    });
    return container;
  }

  it("renders Overview and Audit Trail tabs, filters audit events, and logs new updates", () => {
    if (!HTMLElement.prototype.hasPointerCapture) {
      HTMLElement.prototype.hasPointerCapture = () => false;
    }
    if (!HTMLElement.prototype.releasePointerCapture) {
      HTMLElement.prototype.releasePointerCapture = () => undefined;
    }
    if (!HTMLElement.prototype.scrollIntoView) {
      HTMLElement.prototype.scrollIntoView = () => undefined;
    }

    mount(<JobCardAuditHarness />);

    expect(document.body.textContent).toContain("Job Card JC-900");
    expect(document.body.textContent).toContain("Inspect brake calipers and suspension bushings");

    const auditTab = Array.from(document.body.querySelectorAll('[role="tab"]')).find((el) =>
      el.textContent?.includes("Audit Trail"),
    ) as HTMLElement | undefined;
    expect(auditTab).toBeDefined();
    expect(auditTab?.textContent).toContain("Audit Trail (1)");

    act(() => {
      auditTab?.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }),
      );
      auditTab?.click();
    });

    expect(document.body.querySelector('[data-testid="job-card-audit-trail"]')).not.toBeNull();
    expect(document.body.textContent).toContain("Job card JC-900 created for Mechanical");
    expect(document.body.textContent).toContain("Initial foreman check");

    // Change status via Select, assign an employee, and add an audit note
    const statusTrigger = document.body.querySelector(
      'button[aria-label="Audit status"]',
    ) as HTMLButtonElement;
    act(() => {
      statusTrigger.focus();
      statusTrigger.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0 }),
      );
      statusTrigger.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      );
    });
    const inProgressOpt = Array.from(document.body.querySelectorAll('[role="option"]')).find(
      (opt) => opt.textContent?.includes("In progress"),
    ) as HTMLElement | undefined;
    expect(inProgressOpt).toBeDefined();
    act(() => {
      inProgressOpt?.click();
    });

    const empInput = document.body.querySelector("#audit-employee-input") as HTMLInputElement;
    const noteInput = document.body.querySelector("#audit-note-input") as HTMLTextAreaElement;
    const nativeInputSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;

    act(() => {
      nativeInputSetter?.call(empInput, "Peter Zulu");
      empInput.dispatchEvent(new Event("input", { bubbles: true }));
      nativeTextareaSetter?.call(noteInput, "Replaced front stabilizer link");
      noteInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const logBtn = Array.from(document.body.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Log Update"),
    ) as HTMLButtonElement;
    act(() => {
      logBtn.click();
    });

    expect(auditTab?.textContent).toContain("Audit Trail (3)");
    expect(document.body.textContent).toContain("Status updated from Pending to In progress");
    expect(document.body.textContent).toContain("Assigned to Peter Zulu");
    expect(document.body.textContent).toContain("Replaced front stabilizer link");

    // Filter to Status changes only -> 1 item
    const statusFilterBtn = Array.from(document.body.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Status changes (1)"),
    ) as HTMLButtonElement;
    act(() => {
      statusFilterBtn.click();
    });
    expect(
      document.body.querySelectorAll('[data-testid="job-card-audit-trail"] > li'),
    ).toHaveLength(1);

    // Filter to Notes (2: initial foreman check + status change note)
    const notesFilterBtn = Array.from(document.body.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Notes (2)"),
    ) as HTMLButtonElement;
    expect(notesFilterBtn).toBeDefined();
    act(() => {
      notesFilterBtn.click();
    });
    expect(
      document.body.querySelectorAll('[data-testid="job-card-audit-trail"] > li'),
    ).toHaveLength(2);
  });
});
