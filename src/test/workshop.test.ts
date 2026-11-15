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
} from "@/lib/workshop";
import { toCreateJobCardRequest } from "@/lib/api";

const fixtureVehicles = [
  {
    id: "VR-1068",
    plate: "BCA 4821",
    make: "Toyota Hilux",
    customer: "",
    phone: "",
    email: "",
    received: "11 Nov 2026",
    stage: 9,
    department: "Mechanical",
    foreman: "Foreman 01",
    complaints: "Suspension noise and brake squeal at low speed.",
    damage: "Front bumper scuff; small dent on right-hand front door.",
    due: "13 Nov 2026",
    progress: 65,
  },
  {
    id: "VR-1067",
    plate: "BAZ 7390",
    make: "Ford Ranger",
    customer: "",
    phone: "",
    email: "",
    received: "11 Nov 2026",
    stage: 2,
    department: "Unassigned",
    foreman: "Foreman 02",
    complaints: "Front bodywork damage after collision.",
    damage: "Front left fender and bumper damage.",
    due: "16 Nov 2026",
    progress: 18,
  },
  {
    id: "VR-1066",
    plate: "BCE 2156",
    make: "Isuzu D-Max",
    customer: "",
    phone: "",
    email: "",
    received: "10 Nov 2026",
    stage: 6,
    department: "Mechanical",
    foreman: "Foreman 01",
    complaints: "Worn shock absorbers and uneven braking.",
    damage: "Rear bumper scratches.",
    due: "14 Nov 2026",
    progress: 38,
  },
  {
    id: "VR-1065",
    plate: "BAC 9082",
    make: "Toyota Land Cruiser",
    customer: "",
    phone: "",
    email: "",
    received: "10 Nov 2026",
    stage: 10,
    department: "Fitting",
    foreman: "Foreman 03",
    complaints: "Replace windscreen and adjust door fittings.",
    damage: "Cracked windscreen.",
    due: "12 Nov 2026",
    progress: 94,
  },
  {
    id: "VR-1064",
    plate: "BAL 5643",
    make: "Nissan Navara",
    customer: "",
    phone: "",
    email: "",
    received: "09 Nov 2026",
    stage: 7,
    department: "Panel Beating",
    foreman: "Foreman 04",
    complaints: "Repair rear quarter panel and repaint.",
    damage: "Left rear quarter panel dent.",
    due: "10 Nov 2026",
    progress: 42,
  },
  {
    id: "VR-1063",
    plate: "BBD 1675",
    make: "Mitsubishi Pajero",
    customer: "",
    phone: "",
    email: "",
    received: "09 Nov 2026",
    stage: 11,
    department: "Painting",
    foreman: "Foreman 02",
    complaints: "Full exterior respray.",
    damage: "Faded paint and surface scratches.",
    due: "11 Nov 2026",
    progress: 100,
  },
  {
    id: "VR-1062",
    plate: "BCH 3209",
    make: "Ford Everest",
    customer: "",
    phone: "",
    email: "",
    received: "08 Nov 2026",
    stage: 9,
    department: "Sanding",
    foreman: "Foreman 04",
    complaints: "Prepare panels for paint.",
    damage: "Bonnet and door surface scratches.",
    due: "13 Nov 2026",
    progress: 72,
  },
  {
    id: "VR-1061",
    plate: "BBE 7710",
    make: "Toyota Fortuner",
    customer: "",
    phone: "",
    email: "",
    received: "08 Nov 2026",
    stage: 3,
    department: "Unassigned",
    foreman: "Foreman 03",
    complaints: "Service and front brake replacement.",
    damage: "No visible external damage.",
    due: "15 Nov 2026",
    progress: 25,
  },
];

const fixtureQuotations = [
  {
    id: "QT-1024",
    vehicleId: "VR-1068",
    amount: 12850,
    description: "Front brake assembly and suspension repair",
    status: "Approved",
    approvalReference: "Customer signed quotation · 10 Nov 2026",
  },
  {
    id: "QT-1023",
    vehicleId: "VR-1067",
    amount: 18700,
    description: "Front bumper and fender replacement, paint and labour",
    status: "Awaiting approval",
  },
  {
    id: "QT-1022",
    vehicleId: "VR-1066",
    amount: 9600,
    description: "Shock absorbers and brake service",
    status: "Approved",
    approvalReference: "Customer confirmed by email · 10 Nov 2026",
  },
  {
    id: "QT-1021",
    vehicleId: "VR-1065",
    amount: 6400,
    description: "Windscreen replacement and fittings",
    status: "Approved",
  },
  {
    id: "QT-1020",
    vehicleId: "VR-1064",
    amount: 14300,
    description: "Panel repair and paint",
    status: "Approved",
  },
  {
    id: "QT-1019",
    vehicleId: "VR-1061",
    amount: 8200,
    description: "Service, brake pads and labour",
    status: "Approved",
    approvalReference: "Signed quotation · 09 Nov 2026",
  },
];

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
      fixtureVehicles,
      { key: "received", direction: "asc" },
      (v) => v.received,
    );
    expect(byDateAsc[0]?.received).toBe("08 Nov 2026");
    expect(byDateAsc.at(-1)?.received).toBe("11 Nov 2026");

    const byAmountDesc = sortRecords(
      fixtureQuotations,
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
