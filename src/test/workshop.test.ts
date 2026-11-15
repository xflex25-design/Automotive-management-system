import { describe, expect, it } from "vitest";
import {
  userCategories,
  foremen,
  departments,
  workflowStages,
  canDecideParts,
  canAuthorizeRelease,
  canCreateInventory,
  formatCompactNumber,
  formatCompactCurrency,
  nextSortState,
  sortRecords,
  sampleVehicles,
  sampleQuotations,
} from "@/lib/workshop";
import { toCreateJobCardRequest } from "@/lib/api";

describe("Garage staff and official workflow", () => {
  it("has Foreman, Management, Director and Employee user categories", () => {
    expect(userCategories).toEqual(["Foreman", "Management", "Director", "Employee"]);
  });
  it("supports four individual foremen", () => {
    expect(foremen).toEqual(["Foreman 01", "Foreman 02", "Foreman 03", "Foreman 04"]);
  });
  it("treats workshop disciplines as departments, not user categories", () => {
    expect(departments).toEqual(["Mechanical", "Panel Beating", "Fitting", "Painting", "Sanding"]);
    expect(departments.every((d) => !userCategories.some((r) => r === String(d)))).toBe(true);
  });
  it("keeps all twelve stages in the required order", () => {
    expect(workflowStages).toEqual([
      "Vehicle Registration / Intake",
      "Quotation",
      "Customer Authorization",
      "Inventory Card",
      "Job Card",
      "Parts Requisition",
      "Director's Authorization",
      "Procurement",
      "Parts Dispatch",
      "Repair Workflow",
      "Inspection and Sign-off",
      "Invoice and Vehicle Release",
    ]);
  });
  it("allows only the Director to decide parts requests", () => {
    expect(canDecideParts("Director")).toBe(true);
    expect(canDecideParts("Foreman")).toBe(false);
    expect(canDecideParts("Management")).toBe(false);
  });
  it("requires customer quotation approval before an inventory card", () => {
    expect(canCreateInventory("Approved")).toBe(true);
    expect(canCreateInventory("Draft")).toBe(false);
    expect(canCreateInventory("Awaiting approval")).toBe(false);
  });
  it("assigns final release authorization to Management", () => {
    expect(canAuthorizeRelease("Management")).toBe(true);
    expect(canAuthorizeRelease("Foreman")).toBe(false);
    expect(canAuthorizeRelease("Director")).toBe(false);
  });
  it("shortens large KPI numbers while keeping smaller values exact", () => {
    expect(formatCompactNumber(42)).toBe("42");
    expect(formatCompactNumber(1250)).toBe("1,250");
    expect(formatCompactNumber(12500)).toBe("12.5K");
    expect(formatCompactNumber(1500000)).toBe("1.5M");
    expect(formatCompactCurrency(12500)).toBe("K 12.5K");
    expect(formatCompactCurrency(1500000)).toBe("K 1.5M");
  });
  it("cycles table sort state asc -> desc -> null and resets on column change", () => {
    const s1 = nextSortState(null, "customer");
    expect(s1).toEqual({ key: "customer", direction: "asc" });
    const s2 = nextSortState(s1, "customer");
    expect(s2).toEqual({ key: "customer", direction: "desc" });
    const s3 = nextSortState(s2, "customer");
    expect(s3).toBeNull();
    const s4 = nextSortState(s1, "received");
    expect(s4).toEqual({ key: "received", direction: "asc" });
  });
  it("sorts records chronologically by date and numerically by amount", () => {
    const byDateAsc = sortRecords(
      sampleVehicles,
      { key: "received", direction: "asc" },
      (v) => v.received,
    );
    expect(byDateAsc[0]?.received).toBe("08 Nov 2026");
    expect(byDateAsc.at(-1)?.received).toBe("11 Nov 2026");

    const byAmountDesc = sortRecords(
      sampleQuotations,
      { key: "amount", direction: "desc" },
      (q) => q.amount,
    );
    expect(byAmountDesc.map((q) => q.amount)).toEqual([18700, 14300, 12850, 9600, 8200, 6400]);

    const withMissing = [
      { id: "B", due: "" },
      { id: "A", due: "10/11/2026" },
      { id: "C", due: "09/11/2026" },
    ];
    expect(
      sortRecords(withMissing, { key: "due", direction: "asc" }, (item) => item.due).map(
        (i) => i.id,
      ),
    ).toEqual(["C", "A", "B"]);
  });

  it("maps JobCard fields to backend create request including department and remarks", () => {
    const testJob = {
      id: "JC-9999",
      vehicleId: "VR-1001",
      department: "Panel Beating",
      work: "Straighten left fender and bumper",
      status: "Pending",
      due: "2026-11-20",
      remarks: "Customer noted small scratch on driver door",
      preparedBy: "John Doe",
      preparedByEmployeeId: 42,
      photos: ["data:image/png;base64,sample1", "data:image/png;base64,sample2"],
    };
    const req = toCreateJobCardRequest(testJob, { jobId: 101, quotationId: 202 });
    expect(req.jobId).toBe(101);
    expect(req.quotationId).toBe(202);
    expect(req.preparedByEmployeeId).toBe(42);
    expect(req.workDescription).toBe("Straighten left fender and bumper");
    expect(req.repairInstructions).toBe("Straighten left fender and bumper");
    expect(req.foremanRemarks).toBe(
      "Department: Panel Beating · Customer noted small scratch on driver door",
    );
  });
});
