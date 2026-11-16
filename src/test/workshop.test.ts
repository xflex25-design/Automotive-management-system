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
  matchesVehicleSearch,
  filterVehicles,
  getVehicleStatusCategory,
  vehicleRegistrationStatuses,
  createJobCardAuditEntry,
  appendJobCardAuditUpdate,
  buildJobCardAuditTrail,
  filterJobCardAuditTrail,
  departmentStats,
  buildDepartmentOverview,
  createJobCardStatusNotification,
  dispatchBrowserNotification,
  getNotificationAudience,
  isRelevantNotification,
  type JobCard,
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
  it("allows Director and Management to decide parts requests", () => {
    expect(canDecideParts("Director")).toBe(true);
    expect(canDecideParts("Management")).toBe(true);
    expect(canDecideParts("Foreman")).toBe(false);
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

  it("filters vehicles by VIN, license plate, or owner name case-insensitively", () => {
    const vehiclesWithDetails = [
      {
        ...fixtureVehicles[0]!,
        customer: "John Mwansa",
        vin: "1HGBH41JXMN109186",
      },
      {
        ...fixtureVehicles[1]!,
        customer: "Sarah Banda",
        vin: "2T1BURHE0JC073215",
      },
      {
        ...fixtureVehicles[2]!,
        customer: "Peter Phiri",
      },
    ];

    expect(matchesVehicleSearch(vehiclesWithDetails[0]!, "109186")).toBe(true);
    expect(matchesVehicleSearch(vehiclesWithDetails[0]!, "1hgbh41jxmn109186")).toBe(true);
    expect(matchesVehicleSearch(vehiclesWithDetails[0]!, "bca 4821")).toBe(true);
    expect(matchesVehicleSearch(vehiclesWithDetails[0]!, "mwansa")).toBe(true);
    expect(matchesVehicleSearch(vehiclesWithDetails[2]!, "109186")).toBe(false);

    expect(filterVehicles(vehiclesWithDetails, { query: "  2T1BUR " }).map((v) => v.id)).toEqual([
      "VR-1067",
    ]);
    expect(filterVehicles(vehiclesWithDetails, { query: "bce 2156" }).map((v) => v.id)).toEqual([
      "VR-1066",
    ]);
    expect(filterVehicles(vehiclesWithDetails, { query: "john" }).map((v) => v.id)).toEqual([
      "VR-1068",
    ]);
    expect(
      filterVehicles(vehiclesWithDetails, { query: "2T1BUR", stage: "2" }).map((v) => v.id),
    ).toEqual(["VR-1067"]);
    expect(
      filterVehicles(vehiclesWithDetails, { query: "2T1BUR", stage: "9" }).map((v) => v.id),
    ).toEqual([]);
    expect(filterVehicles(vehiclesWithDetails, { query: "" })).toHaveLength(3);
  });

  it("categorizes vehicle status and filters vehicles by status alongside search queries", () => {
    expect(vehicleRegistrationStatuses).toEqual([
      "All",
      "Active",
      "In Repair",
      "Completed",
      "Delivered",
    ]);

    const statusVehicles = [
      { ...fixtureVehicles[1]!, customer: "Sarah Banda", stage: 2 }, // Active
      { ...fixtureVehicles[0]!, customer: "John Mwansa", stage: 9 }, // In Repair
      { ...fixtureVehicles[3]!, customer: "Grace Zulu", stage: 10 }, // Completed
      { ...fixtureVehicles[5]!, customer: "Peter Phiri", stage: 11, released: true }, // Delivered
    ];

    expect(getVehicleStatusCategory(statusVehicles[0]!)).toBe("Active");
    expect(getVehicleStatusCategory(statusVehicles[1]!)).toBe("In Repair");
    expect(getVehicleStatusCategory(statusVehicles[2]!)).toBe("Completed");
    expect(getVehicleStatusCategory(statusVehicles[3]!)).toBe("Delivered");

    expect(filterVehicles(statusVehicles, { status: "All" })).toHaveLength(4);
    expect(filterVehicles(statusVehicles, { status: "Active" }).map((v) => v.id)).toEqual([
      "VR-1067",
    ]);
    expect(filterVehicles(statusVehicles, { status: "In Repair" }).map((v) => v.id)).toEqual([
      "VR-1068",
    ]);
    expect(filterVehicles(statusVehicles, { status: "Completed" }).map((v) => v.id)).toEqual([
      "VR-1065",
    ]);
    expect(filterVehicles(statusVehicles, { status: "Delivered" }).map((v) => v.id)).toEqual([
      "VR-1063",
    ]);
    expect(
      filterVehicles(statusVehicles, { query: "Grace", status: "Completed" }).map((v) => v.id),
    ).toEqual(["VR-1065"]);
    expect(
      filterVehicles(statusVehicles, { query: "Grace", status: "Active" }).map((v) => v.id),
    ).toEqual([]);
  });

  it("tracks job card status changes, notes, employee updates, and workflow events in the audit trail", () => {
    const baseJob: JobCard = {
      id: "JC-900",
      vehicleId: "VR-1068",
      department: "Mechanical",
      work: "Inspect front suspension and replace brake pads",
      status: "Pending",
      due: "2026-11-20",
      remarks: "Initial foreman check completed",
      preparedBy: "Foreman 01",
      backendJobId: 501,
      auditTrail: [
        createJobCardAuditEntry({
          type: "created",
          actor: "Foreman 01",
          actorRole: "Foreman",
          summary: "Job card JC-900 created for Mechanical",
          newStatus: "Pending",
          department: "Mechanical",
          note: "Initial foreman check completed",
          recordedAtMs: 1000,
          timestamp: "15 Nov 2026, 08:00",
        }),
      ],
    };

    const withStatusAndEmployee = appendJobCardAuditUpdate(baseJob, {
      status: "In progress",
      assignedEmployee: "Peter Zulu",
      progress: 40,
      note: "Removed front caliper and ordered bushings",
      actor: "Peter Zulu",
      actorRole: "Employee",
      recordedAtMs: 2000,
      timestamp: "15 Nov 2026, 09:30",
    });

    expect(withStatusAndEmployee.status).toBe("In progress");
    expect(withStatusAndEmployee.assignedEmployee).toBe("Peter Zulu");
    expect(withStatusAndEmployee.progress).toBe(40);
    expect(withStatusAndEmployee.auditTrail).toHaveLength(3);

    const withNoteOnly = appendJobCardAuditUpdate(withStatusAndEmployee, {
      status: "In progress",
      assignedEmployee: "Peter Zulu",
      progress: 40,
      note: "Bushings delivered from stores",
      actor: "Foreman 01",
      actorRole: "Foreman",
      recordedAtMs: 3000,
      timestamp: "15 Nov 2026, 11:00",
    });

    expect(withNoteOnly.auditTrail).toHaveLength(4);
    expect(withNoteOnly.remarks).toBe("Bushings delivered from stores");

    // No-op when nothing changed and no note provided
    const unchanged = appendJobCardAuditUpdate(withNoteOnly, {
      status: "In progress",
      assignedEmployee: "Peter Zulu",
      progress: 40,
      note: "   ",
      actor: "Foreman 01",
    });
    expect(unchanged).toBe(withNoteOnly);

    const workflows = [
      {
        jobId: 501,
        workOrders: [
          {
            workOrderNumber: "WO-12",
            departmentName: "Mechanical",
            assignments: [
              {
                assignmentId: 10,
                employeeName: "Mary Phiri",
                assignmentRole: "TECHNICIAN",
                assignedAt: "2026-11-15T12:00:00Z",
              },
            ],
            departmentVisits: [
              {
                departmentVisitId: 20,
                departmentName: "Mechanical",
                status: "OPEN",
                arrivedAt: "2026-11-15T12:15:00Z",
              },
            ],
            evidence: [
              {
                evidenceId: 30,
                notes: "Torque verified on hub bolts",
                uploadedByName: "Mary Phiri",
                createdAt: "2026-11-15T12:30:00Z",
              },
            ],
          },
        ],
      },
    ];

    const fullTrail = buildJobCardAuditTrail(withNoteOnly, workflows);
    expect(fullTrail.length).toBe(7);
    // Newest entries come first (2026-11-15T12:30Z > recordedAtMs 3000)
    expect(filterJobCardAuditTrail(fullTrail, "status_change").length).toBe(2);
    expect(filterJobCardAuditTrail(fullTrail, "note").length).toBe(4);
    expect(filterJobCardAuditTrail(fullTrail, "employee_update").length).toBe(2);
    expect(filterJobCardAuditTrail(fullTrail, "created").length).toBe(1);

    // Synthesizes a created entry if job has no explicit auditTrail
    const bareTrail = buildJobCardAuditTrail({
      ...baseJob,
      auditTrail: undefined,
    });
    expect(bareTrail).toHaveLength(1);
    expect(bareTrail[0]?.type).toBe("created");
    expect(bareTrail[0]?.note).toBe("Initial foreman check completed");
  });

  it("keeps department overview empty without sample data until jobs or workflows are recorded", () => {
    expect(departmentStats).toEqual([]);
    expect(buildDepartmentOverview([], [])).toEqual([]);

    const jobs: JobCard[] = [
      {
        id: "JC-101",
        vehicleId: "VR-1001",
        department: "Mechanical",
        work: "Overhaul front axle",
        status: "In progress",
        due: "2026-11-20",
      },
      {
        id: "JC-102",
        vehicleId: "VR-1002",
        department: "Mechanical",
        work: "Replace brake pads",
        status: "Complete",
        due: "2026-11-10",
      },
      {
        id: "JC-103",
        vehicleId: "VR-1003",
        department: "Painting",
        work: "Respray fender",
        status: "Awaiting parts",
        due: "2026-11-18",
      },
      {
        // Covered by workflow below -> should not be double counted
        id: "JC-104",
        vehicleId: "VR-1004",
        department: "Fitting",
        work: "Bullbar mount",
        status: "Pending",
        due: "2026-11-25",
        backendJobId: 901,
      },
    ];

    const workflows = [
      {
        jobId: 901,
        repairPlanId: 401,
        workOrders: [
          {
            workOrderId: 1,
            departmentName: "Fitting",
            status: "COMPLETED",
            dueAt: "2026-11-25",
          },
        ],
      },
    ];

    const overview = buildDepartmentOverview(jobs, workflows, "2026-11-15");
    expect(overview).toEqual([
      {
        name: "Mechanical",
        assigned: 2,
        active: 1,
        completed: 1,
        pending: 0,
        delays: 0,
        efficiency: 50,
      },
      {
        name: "Fitting",
        assigned: 1,
        active: 0,
        completed: 1,
        pending: 0,
        delays: 0,
        efficiency: 100,
      },
      {
        name: "Painting",
        assigned: 1,
        active: 0,
        completed: 0,
        pending: 1,
        delays: 1,
        efficiency: 0,
      },
    ]);
  });

  it("targets relevant employees and dispatches browser notifications on job card status changes", () => {
    const job: JobCard = {
      id: "JC-777",
      vehicleId: "VR-1061",
      department: "Mechanical",
      work: "Replace timing belt",
      status: "In Repair",
      due: "2026-11-22",
      assignedEmployee: "Peter Zulu",
    };

    // Moving from In Repair -> Completed alerts Mechanical team, Foreman, and Management
    const audience = getNotificationAudience(job, "In Repair", "Completed");
    expect(audience.targetRoles).toEqual(["Employee", "Foreman", "Management"]);
    expect(audience.targetAudience).toContain("Mechanical team (Peter Zulu)");
    expect(audience.targetAudience).toContain("Management");

    // Same-status update returns null
    expect(
      createJobCardStatusNotification({
        job,
        previousStatus: "In Repair",
        newStatus: "in repair",
        actor: "Foreman 01",
      }),
    ).toBeNull();

    const notif = createJobCardStatusNotification({
      job: { ...job, status: "Completed" },
      previousStatus: "In Repair",
      newStatus: "Completed",
      actor: "Peter Zulu",
      vehicleLabel: "Toyota Hilux (BCA 4821)",
      createdAtMs: 5000,
      timestamp: "15 Nov 2026, 14:30",
    });
    expect(notif).not.toBeNull();
    expect(notif?.title).toBe("Job Card JC-777 · In Repair → Completed");
    expect(notif?.message).toContain("Toyota Hilux (BCA 4821)");
    expect(notif?.message).toContain('moved from "In Repair" to "Completed"');

    // Relevance check per role and department
    expect(isRelevantNotification(notif!, { role: "Employee", department: "Mechanical" })).toBe(
      true,
    );
    expect(isRelevantNotification(notif!, { role: "Employee", department: "Painting" })).toBe(
      false,
    );
    expect(
      isRelevantNotification(notif!, {
        role: "Employee",
        department: "Painting",
        employeeName: "Peter Zulu",
      }),
    ).toBe(true);
    expect(isRelevantNotification(notif!, { role: "Management" })).toBe(true);
    expect(isRelevantNotification(notif!, { role: "Director" })).toBe(false);

    // Dispatches native browser Notification when permission is granted
    const spawned: Array<{ title: string; body?: string }> = [];
    class FakeNotification {
      static permission: NotificationPermission = "granted";
      constructor(title: string, options?: NotificationOptions) {
        spawned.push({ title, body: options?.body });
      }
    }
    let fallbackCount = 0;
    const sent = dispatchBrowserNotification(notif!, {
      NotificationCtor: FakeNotification as unknown as typeof Notification,
      onFallbackAlert: () => {
        fallbackCount += 1;
      },
    });
    expect(sent).toBe(true);
    expect(spawned).toHaveLength(1);
    expect(spawned[0]?.title).toBe("Job Card JC-777 · In Repair → Completed");
    expect(fallbackCount).toBe(1);

    // Skips native Notification when permission is denied, still runs fallback
    FakeNotification.permission = "denied";
    const sentWhenDenied = dispatchBrowserNotification(notif!, {
      NotificationCtor: FakeNotification as unknown as typeof Notification,
      onFallbackAlert: () => {
        fallbackCount += 1;
      },
    });
    expect(sentWhenDenied).toBe(false);
    expect(spawned).toHaveLength(1);
    expect(fallbackCount).toBe(2);
  });
});
