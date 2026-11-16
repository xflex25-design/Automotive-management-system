export const userCategories = ["Foreman", "Management", "Director", "Employee"] as const;
export type WorkspaceRole = (typeof userCategories)[number];
export const foremen = ["Foreman 01", "Foreman 02", "Foreman 03", "Foreman 04"] as const;
export const departments = [
  "Mechanical",
  "Panel Beating",
  "Fitting",
  "Painting",
  "Sanding",
] as const;
export const workflowStages = [
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
] as const;
export function stageName(index: number) {
  return workflowStages[index] ?? workflowStages[0];
}
export const stageOwners = [
  "Foreman",
  "Foreman",
  "Customer",
  "Foreman",
  "Foreman",
  "Foreman",
  "Director",
  "Procurement",
  "Workshop",
  "Department",
  "Foreman",
  "Management",
];
export function canDecideParts(role: WorkspaceRole) {
  return role === "Director" || role === "Management";
}
export function canAuthorizeRelease(role: WorkspaceRole) {
  return role === "Management";
}
export function canCreateInventory(quotationStatus: string) {
  return quotationStatus === "Approved";
}

export type Vehicle = {
  id: string;
  plate: string;
  make: string;
  customer: string;
  phone: string;
  email: string;
  received: string;
  stage: number;
  department: string;
  foreman: string;
  complaints: string;
  damage: string;
  due: string;
  progress: number;
  photos?: string[];
  released?: boolean;
  vin?: string;
  odometer?: number;
  color?: string;
};
export type CatalogPart = {
  id: number;
  code: string;
  name: string;
  unit: string;
  description?: string;
};
export type Quotation = {
  id: string;
  vehicleId: string;
  amount: number;
  description: string;
  status: "Draft" | "Awaiting approval" | "Approved";
  backendId?: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  quotationDate?: string;
  preparedByName?: string;
  paperFields?: Record<string, string>;
  items?: Array<{
    itemType: "PART" | "LABOUR" | "SERVICE" | "OTHER";
    item: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    lineTotal?: number;
    taxAmount?: number;
  }>;
  approvalReference?: string;
  catalogPartId?: number;
  quantity?: number;
  customerApprovalToken?: string;
};
export type InventoryCard = {
  id: string;
  vehicleId: string;
  items: string;
  condition: string;
  date: string;
};
export const jobCardStatuses = [
  "Pending",
  "In Repair",
  "In progress",
  "Awaiting parts",
  "Approved",
  "Completed",
  "Complete",
  "Flagged",
  "Rework required",
] as const;

export type JobCardAuditEntryType = "created" | "status_change" | "note" | "employee_update";

export type JobCardAuditEntry = {
  id: string;
  type: JobCardAuditEntryType;
  timestamp: string;
  recordedAtMs?: number;
  actor: string;
  actorRole?: string;
  summary: string;
  previousStatus?: string;
  newStatus?: string;
  progress?: number;
  note?: string;
  employeeName?: string;
  department?: string;
};

export type JobCard = {
  id: string;
  vehicleId: string;
  department: string;
  work: string;
  status: string;
  due: string;
  backendJobCardId?: number;
  backendJobId?: number;
  repairPlanId?: number;
  parts?: Array<{ id: number; partId?: number; code?: string; name: string; quantity: number }>;
  remarks?: string;
  preparedBy?: string;
  preparedByEmployeeId?: number;
  assignedEmployee?: string;
  progress?: number;
  photos?: string[];
  auditTrail?: JobCardAuditEntry[];
};
export type Requisition = {
  id: string;
  vehicleId: string;
  part: string;
  quantity: number;
  department: string;
  reason: string;
  amount: number;
  foreman: string;
  status: "Pending" | "Approved" | "Rejected" | "Ordered" | "Dispatched";
  date: string;
  decisionNote?: string;
  backendId?: number;
  lines?: Array<{
    id: number;
    partId: number;
    code: string;
    name: string;
    quantity: number;
    unit: string;
  }>;
};
export type Inspection = {
  id: string;
  vehicleId: string;
  foreman: string;
  date: string;
  result: "Pending" | "Passed" | "Rework required";
  notes: string;
  backendId?: number;
};
export const money = (value: number) =>
  `K ${value.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    const scaled = (abs / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${sign}${scaled}M`;
  }
  if (abs >= 10_000) {
    const scaled = (abs / 1_000).toFixed(1).replace(/\.0$/, "");
    return `${sign}${scaled}K`;
  }
  if (abs >= 1_000) {
    return `${sign}${abs.toLocaleString("en-US")}`;
  }
  return String(value);
}

export function formatCompactCurrency(value: number): string {
  if (!Number.isFinite(value)) return "K 0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    const scaled = (abs / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${sign}K ${scaled}M`;
  }
  if (abs >= 1_000) {
    const scaled = (abs / 1_000).toFixed(1).replace(/\.0$/, "");
    return `${sign}K ${scaled}K`;
  }
  return `${sign}K ${Math.round(abs).toLocaleString("en-US")}`;
}

export type SortDirection = "asc" | "desc";
export type SortState<K extends string = string> = {
  key: K;
  direction: SortDirection;
} | null;
export type SortableValue = string | number | boolean | null | undefined;

export function nextSortState<K extends string>(current: SortState<K>, key: K): SortState<K> {
  if (current?.key === key) {
    if (current.direction === "asc") return { key, direction: "desc" };
    return null;
  }
  return { key, direction: "asc" };
}

function parseSortableDate(value: string): number | null {
  const trimmed = value.trim();
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const timestamp = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  }
  if (
    /^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/.test(trimmed) ||
    /^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}$/.test(trimmed)
  ) {
    const timestamp = Date.parse(trimmed);
    return Number.isNaN(timestamp) ? null : timestamp;
  }
  return null;
}

export function compareSortValues(a: SortableValue, b: SortableValue): number {
  const emptyA = a === null || a === undefined || a === "";
  const emptyB = b === null || b === undefined || b === "";
  if (emptyA && emptyB) return 0;
  if (emptyA) return 1;
  if (emptyB) return -1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }

  const strA = String(a).trim();
  const strB = String(b).trim();
  const dateA = parseSortableDate(strA);
  const dateB = parseSortableDate(strB);
  if (dateA !== null && dateB !== null) {
    return dateA - dateB;
  }

  return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: "base" });
}

export function sortRecords<T, K extends string = string>(
  items: readonly T[],
  sort: SortState<K>,
  getValue: (item: T, key: K) => SortableValue,
): T[] {
  if (!sort) return [...items];
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...items].sort((left, right) => {
    const a = getValue(left, sort.key);
    const b = getValue(right, sort.key);
    const emptyA = a === null || a === undefined || a === "";
    const emptyB = b === null || b === undefined || b === "";
    if (emptyA && emptyB) return 0;
    if (emptyA) return 1;
    if (emptyB) return -1;
    return compareSortValues(a, b) * factor;
  });
}

export const vehicleRegistrationStatuses = [
  "All",
  "Active",
  "In Repair",
  "Completed",
  "Delivered",
] as const;

export type VehicleRegistrationStatusFilter = (typeof vehicleRegistrationStatuses)[number];
export type VehicleRegistrationStatus = Exclude<VehicleRegistrationStatusFilter, "All">;

export function getVehicleStatusCategory(vehicle: Vehicle): VehicleRegistrationStatus {
  if (vehicle.released) return "Delivered";
  if (vehicle.stage >= 10) return "Completed";
  if (vehicle.stage >= 4) return "In Repair";
  return "Active";
}

export function matchesVehicleSearch(vehicle: Vehicle, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  const searchable = [vehicle.vin ?? "", vehicle.plate, vehicle.customer, vehicle.make, vehicle.id]
    .join(" ")
    .toLowerCase();
  return searchable.includes(query);
}

export function filterVehicles(
  vehicles: readonly Vehicle[],
  options: {
    query?: string;
    globalSearch?: string;
    stage?: string;
    status?: VehicleRegistrationStatusFilter;
  } = {},
): Vehicle[] {
  const { query = "", globalSearch = "", stage = "All", status = "All" } = options;
  return vehicles.filter(
    (v) =>
      matchesVehicleSearch(v, query) &&
      matchesVehicleSearch(v, globalSearch) &&
      (stage === "All" || String(v.stage) === stage) &&
      (status === "All" || getVehicleStatusCategory(v) === status),
  );
}

export function formatAuditTimestamp(date = new Date()): string {
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function createJobCardAuditEntry(
  input: Omit<JobCardAuditEntry, "id" | "timestamp" | "recordedAtMs"> & {
    id?: string;
    timestamp?: string;
    recordedAtMs?: number;
  },
): JobCardAuditEntry {
  const now = new Date();
  return {
    ...input,
    id: input.id ?? `audit-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: input.timestamp ?? formatAuditTimestamp(now),
    recordedAtMs: input.recordedAtMs ?? now.getTime(),
  };
}

export type JobCardAuditUpdateInput = {
  status?: string;
  note?: string;
  assignedEmployee?: string;
  progress?: number;
  department?: string;
  actor: string;
  actorRole?: string;
  timestamp?: string;
  recordedAtMs?: number;
};

export function appendJobCardAuditUpdate(job: JobCard, update: JobCardAuditUpdateInput): JobCard {
  const baseMs = update.recordedAtMs ?? Date.now();
  const timestamp = update.timestamp ?? formatAuditTimestamp(new Date(baseMs));
  const actor = update.actor.trim() || "Workshop Staff";
  const nextStatus = update.status?.trim();
  const nextEmployee = update.assignedEmployee?.trim();
  const trimmedNote = update.note?.trim() ?? "";
  const statusChanged = Boolean(nextStatus && nextStatus !== job.status);
  const employeeChanged = Boolean(nextEmployee && nextEmployee !== (job.assignedEmployee ?? ""));
  const progressChanged =
    update.progress !== undefined &&
    Number.isFinite(update.progress) &&
    update.progress !== job.progress;

  const newEntries: JobCardAuditEntry[] = [];
  let offset = 0;

  if (statusChanged && nextStatus) {
    newEntries.unshift(
      createJobCardAuditEntry({
        type: "status_change",
        actor,
        actorRole: update.actorRole,
        timestamp,
        recordedAtMs: baseMs + offset++,
        summary: `Status updated from ${job.status} to ${nextStatus}`,
        previousStatus: job.status,
        newStatus: nextStatus,
        ...(update.progress !== undefined ? { progress: update.progress } : {}),
        ...(trimmedNote ? { note: trimmedNote } : {}),
        department: update.department ?? job.department,
      }),
    );
  }

  if (employeeChanged || progressChanged) {
    const parts: string[] = [];
    if (employeeChanged && nextEmployee) {
      parts.push(`Assigned to ${nextEmployee}`);
    } else if (nextEmployee) {
      parts.push(`Employee update by ${nextEmployee}`);
    } else {
      parts.push("Employee progress update");
    }
    if (update.progress !== undefined) {
      parts.push(`${update.progress}% complete`);
    }
    newEntries.unshift(
      createJobCardAuditEntry({
        type: "employee_update",
        actor,
        actorRole: update.actorRole,
        timestamp,
        recordedAtMs: baseMs + offset++,
        summary: parts.join(" · "),
        ...(nextEmployee ? { employeeName: nextEmployee } : {}),
        ...(update.progress !== undefined ? { progress: update.progress } : {}),
        ...(trimmedNote && !statusChanged ? { note: trimmedNote } : {}),
        department: update.department ?? job.department,
      }),
    );
  }

  if (trimmedNote && !statusChanged && !employeeChanged && !progressChanged) {
    newEntries.unshift(
      createJobCardAuditEntry({
        type: "note",
        actor,
        actorRole: update.actorRole,
        timestamp,
        recordedAtMs: baseMs + offset++,
        summary: "Added workshop note",
        note: trimmedNote,
        department: update.department ?? job.department,
      }),
    );
  }

  if (newEntries.length === 0) {
    return job;
  }

  return {
    ...job,
    ...(statusChanged && nextStatus ? { status: nextStatus } : {}),
    ...(nextEmployee ? { assignedEmployee: nextEmployee } : {}),
    ...(update.progress !== undefined ? { progress: update.progress } : {}),
    ...(trimmedNote ? { remarks: trimmedNote } : {}),
    auditTrail: [...newEntries, ...(job.auditTrail ?? [])],
  };
}

export function buildJobCardAuditTrail(
  job: JobCard,
  workflows: readonly Record<string, unknown>[] = [],
): JobCardAuditEntry[] {
  const existing = [...(job.auditTrail ?? [])];
  const derived: JobCardAuditEntry[] = [];

  if (!existing.some((entry) => entry.type === "created")) {
    derived.push({
      id: `audit-created-${job.id}`,
      type: "created",
      timestamp: job.due ? `Due ${job.due}` : "Initial intake",
      recordedAtMs: 0,
      actor: job.preparedBy || "Workshop Foreman",
      actorRole: "Foreman",
      summary: `Job card ${job.id} created for ${job.department || "Workshop"}`,
      newStatus: existing.length > 0 ? (existing.at(-1)?.previousStatus ?? "Pending") : job.status,
      department: job.department || "Workshop",
      ...(job.remarks ? { note: job.remarks } : {}),
    });
  }

  const matchingPlans = workflows.filter(
    (plan) =>
      (job.backendJobId !== undefined && Number(plan["jobId"]) === job.backendJobId) ||
      (job.repairPlanId !== undefined && Number(plan["repairPlanId"]) === job.repairPlanId),
  );

  for (const plan of matchingPlans) {
    const workOrders = Array.isArray(plan["workOrders"])
      ? (plan["workOrders"] as Record<string, unknown>[])
      : [];
    for (const order of workOrders) {
      const orderTitle = String(
        order["workOrderNumber"] ?? order["taskTitle"] ?? "Work Order",
      ).trim();
      const dept = String(order["departmentName"] ?? job.department ?? "Workshop");
      const assignments = Array.isArray(order["assignments"])
        ? (order["assignments"] as Record<string, unknown>[])
        : [];
      for (const assignment of assignments) {
        const empName = String(assignment["employeeName"] ?? "Technician");
        const assignedAt = String(assignment["assignedAt"] ?? "");
        const parsedMs = assignedAt ? Date.parse(assignedAt) : NaN;
        derived.push({
          id: `audit-assign-${String(assignment["assignmentId"] ?? `${orderTitle}-${empName}`)}`,
          type: "employee_update",
          timestamp: Number.isNaN(parsedMs)
            ? assignedAt || "Recorded"
            : formatAuditTimestamp(new Date(parsedMs)),
          recordedAtMs: Number.isNaN(parsedMs) ? 1 : parsedMs,
          actor: empName,
          actorRole: String(assignment["assignmentRole"] ?? "Employee"),
          employeeName: empName,
          department: dept,
          summary: `Assigned ${empName} to ${orderTitle}`,
        });
      }

      const visits = Array.isArray(order["departmentVisits"])
        ? (order["departmentVisits"] as Record<string, unknown>[])
        : [];
      for (const visit of visits) {
        const visitStatus = String(visit["status"] ?? "OPEN");
        const visitDept = String(visit["departmentName"] ?? dept);
        const arrivedAt = String(visit["arrivedAt"] ?? visit["createdAt"] ?? "");
        const parsedMs = arrivedAt ? Date.parse(arrivedAt) : NaN;
        derived.push({
          id: `audit-visit-${String(visit["departmentVisitId"] ?? `${orderTitle}-${visitDept}`)}`,
          type: "status_change",
          timestamp: Number.isNaN(parsedMs)
            ? arrivedAt || "Recorded"
            : formatAuditTimestamp(new Date(parsedMs)),
          recordedAtMs: Number.isNaN(parsedMs) ? 2 : parsedMs,
          actor: visitDept,
          actorRole: "Department",
          department: visitDept,
          newStatus: visitStatus,
          summary: `${visitDept} visit · ${visitStatus}`,
          ...(visit["notes"] ? { note: String(visit["notes"]) } : {}),
        });
      }

      const sessions = Array.isArray(order["sessions"])
        ? (order["sessions"] as Record<string, unknown>[])
        : [];
      for (const session of sessions) {
        const empName = String(session["employeeName"] ?? "Technician");
        const startedAt = String(session["startedAt"] ?? session["endedAt"] ?? "");
        const parsedMs = startedAt ? Date.parse(startedAt) : NaN;
        derived.push({
          id: `audit-session-${String(session["workSessionId"] ?? `${orderTitle}-${empName}-${startedAt}`)}`,
          type: "employee_update",
          timestamp: Number.isNaN(parsedMs)
            ? startedAt || "Recorded"
            : formatAuditTimestamp(new Date(parsedMs)),
          recordedAtMs: Number.isNaN(parsedMs) ? 3 : parsedMs,
          actor: empName,
          actorRole: "Technician",
          employeeName: empName,
          department: dept,
          summary: `${empName} logged work session (${String(session["status"] ?? "Active")})`,
          ...(session["notes"] ? { note: String(session["notes"]) } : {}),
        });
      }

      const evidence = Array.isArray(order["evidence"])
        ? (order["evidence"] as Record<string, unknown>[])
        : [];
      for (const item of evidence) {
        const noteText = String(item["notes"] ?? item["description"] ?? "").trim();
        if (!noteText) continue;
        const createdAt = String(item["createdAt"] ?? "");
        const parsedMs = createdAt ? Date.parse(createdAt) : NaN;
        derived.push({
          id: `audit-evidence-${String(item["evidenceId"] ?? noteText)}`,
          type: "note",
          timestamp: Number.isNaN(parsedMs)
            ? createdAt || "Recorded"
            : formatAuditTimestamp(new Date(parsedMs)),
          recordedAtMs: Number.isNaN(parsedMs) ? 4 : parsedMs,
          actor: String(item["uploadedByName"] ?? job.preparedBy ?? "Technician"),
          department: dept,
          summary: `Work order note · ${orderTitle}`,
          note: noteText,
        });
      }
    }
  }

  const combined = [...existing, ...derived];
  return combined.sort((a, b) => (b.recordedAtMs ?? 0) - (a.recordedAtMs ?? 0));
}

export function filterJobCardAuditTrail(
  entries: readonly JobCardAuditEntry[],
  filter: "all" | JobCardAuditEntryType,
): JobCardAuditEntry[] {
  if (filter === "all") return [...entries];
  if (filter === "note") {
    return entries.filter((entry) => entry.type === "note" || Boolean(entry.note?.trim()));
  }
  return entries.filter((entry) => entry.type === filter);
}

export const sampleVehicles: Vehicle[] = [];
export const sampleQuotations: Quotation[] = [];
export const sampleInventory: InventoryCard[] = [];
export const sampleJobs: JobCard[] = [];
export const sampleRequisitions: Requisition[] = [];
export const sampleInspections: Inspection[] = [];

export type DepartmentOverviewMetric = {
  name: string;
  assigned: number;
  active: number;
  completed: number;
  pending: number;
  delays: number;
  efficiency: number;
};

export const departmentStats: DepartmentOverviewMetric[] = [];

function isPastDueDate(rawDue: unknown, referenceIsoDate: string): boolean {
  if (typeof rawDue !== "string") return false;
  const trimmed = rawDue.trim();
  if (!trimmed) return false;
  const parsed = Date.parse(trimmed.length === 10 ? `${trimmed}T23:59:59` : trimmed);
  const refParsed = Date.parse(`${referenceIsoDate}T00:00:00`);
  if (Number.isNaN(parsed) || Number.isNaN(refParsed)) return false;
  return parsed < refParsed;
}

export function buildDepartmentOverview(
  jobs: readonly JobCard[],
  workflows: readonly Record<string, unknown>[] = [],
  referenceDate: string = new Date().toISOString().slice(0, 10),
): DepartmentOverviewMetric[] {
  type Accumulator = {
    vehicles: Set<string>;
    total: number;
    active: number;
    completed: number;
    pending: number;
    delays: number;
  };
  const buckets = new Map<string, Accumulator>();
  const ensure = (department: string): Accumulator => {
    const key = department.trim() || "Workshop";
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        vehicles: new Set<string>(),
        total: 0,
        active: 0,
        completed: 0,
        pending: 0,
        delays: 0,
      };
      buckets.set(key, bucket);
    }
    return bucket;
  };

  const linkedPlanJobIds = new Set<number>();
  const linkedPlanIds = new Set<number>();

  for (const plan of workflows) {
    const workOrders = Array.isArray(plan["workOrders"])
      ? (plan["workOrders"] as Record<string, unknown>[])
      : [];
    if (workOrders.length === 0) continue;
    const planJobId = Number(plan["jobId"]);
    const planId = Number(plan["repairPlanId"]);
    if (Number.isFinite(planJobId) && planJobId > 0) linkedPlanJobIds.add(planJobId);
    if (Number.isFinite(planId) && planId > 0) linkedPlanIds.add(planId);

    const matchingJob = jobs.find(
      (j) =>
        (j.backendJobId !== undefined && j.backendJobId === planJobId) ||
        (j.repairPlanId !== undefined && j.repairPlanId === planId),
    );
    const planVehicleKey =
      matchingJob?.vehicleId ||
      (typeof plan["vehicleId"] === "string" || typeof plan["vehicleId"] === "number"
        ? `veh-${String(plan["vehicleId"])}`
        : `plan-${planId || planJobId}`);

    for (const order of workOrders) {
      const dept = String(order["departmentName"] ?? matchingJob?.department ?? "Workshop");
      const bucket = ensure(dept);
      bucket.total += 1;
      bucket.vehicles.add(
        order["workOrderId"] ? `${planVehicleKey}-${dept}` : `${planVehicleKey}-${bucket.total}`,
      );
      const status = String(order["status"] ?? "").toUpperCase();
      const isCompleted = status === "COMPLETED" || status === "CONFIRMED";
      const isActive = status === "IN_PROGRESS" || status === "ACTIVE" || status === "STARTED";
      if (isCompleted) {
        bucket.completed += 1;
      } else if (isActive) {
        bucket.active += 1;
      } else {
        bucket.pending += 1;
      }
      const isBlocked = Boolean(order["isBlocked"]) || status === "BLOCKED";
      if (!isCompleted && (isBlocked || isPastDueDate(order["dueAt"], referenceDate))) {
        bucket.delays += 1;
      }
    }
  }

  for (const job of jobs) {
    const coveredByWorkflow =
      (job.backendJobId !== undefined && linkedPlanJobIds.has(job.backendJobId)) ||
      (job.repairPlanId !== undefined && linkedPlanIds.has(job.repairPlanId));
    if (coveredByWorkflow) continue;

    const bucket = ensure(job.department || "Workshop");
    bucket.total += 1;
    bucket.vehicles.add(job.vehicleId || job.id);
    const normalized = job.status.trim().toLowerCase();
    const isCompleted = normalized === "complete" || normalized === "completed";
    const isActive =
      normalized === "in progress" || normalized === "in repair" || normalized === "approved";
    if (isCompleted) {
      bucket.completed += 1;
    } else if (isActive) {
      bucket.active += 1;
    } else {
      bucket.pending += 1;
    }
    const isAwaitingParts = normalized === "awaiting parts" || normalized === "delayed";
    if (!isCompleted && (isAwaitingParts || isPastDueDate(job.due, referenceDate))) {
      bucket.delays += 1;
    }
  }

  const departmentOrder = new Map<string, number>(departments.map((d, index) => [d, index]));
  return Array.from(buckets.entries())
    .sort(([a], [b]) => {
      const idxA = departmentOrder.get(a) ?? Number.MAX_SAFE_INTEGER;
      const idxB = departmentOrder.get(b) ?? Number.MAX_SAFE_INTEGER;
      return idxA !== idxB ? idxA - idxB : a.localeCompare(b);
    })
    .map(([name, bucket]) => ({
      name,
      assigned: bucket.vehicles.size,
      active: bucket.active,
      completed: bucket.completed,
      pending: bucket.pending,
      delays: bucket.delays,
      efficiency: bucket.total ? Math.round((bucket.completed / bucket.total) * 100) : 0,
    }));
}

export type BrowserNotificationPermission = NotificationPermission | "unsupported";

export type JobCardNotification = {
  id: string;
  jobId: string;
  vehicleId: string;
  vehicleLabel?: string;
  department: string;
  previousStatus: string;
  newStatus: string;
  title: string;
  message: string;
  actor: string;
  targetAudience: string;
  targetRoles: WorkspaceRole[];
  assignedEmployee?: string;
  timestamp: string;
  createdAtMs: number;
  read: boolean;
};

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function getNotificationAudience(
  job: Pick<JobCard, "department" | "assignedEmployee">,
  _previousStatus: string,
  newStatus: string,
): { targetRoles: WorkspaceRole[]; targetAudience: string } {
  const normalized = newStatus.trim().toLowerCase();
  const roles = new Set<WorkspaceRole>(["Employee", "Foreman"]);
  if (
    normalized === "complete" ||
    normalized === "completed" ||
    normalized === "approved" ||
    normalized === "flagged" ||
    normalized === "rework required"
  ) {
    roles.add("Management");
  }
  if (normalized === "awaiting parts" || normalized === "flagged") {
    roles.add("Director");
  }

  const deptLabel = job.department?.trim() || "Workshop";
  const empSuffix = job.assignedEmployee?.trim() ? ` (${job.assignedEmployee.trim()})` : "";
  const extraRoles = Array.from(roles).filter((r) => r !== "Employee");
  const targetAudience = [`${deptLabel} team${empSuffix}`, ...extraRoles].join(" · ");

  return {
    targetRoles: Array.from(roles),
    targetAudience,
  };
}

export function isRelevantNotification(
  notification: JobCardNotification,
  context: { role: WorkspaceRole; department?: string; employeeName?: string },
): boolean {
  if (!notification.targetRoles.includes(context.role)) {
    return false;
  }
  if (context.role === "Employee") {
    const dept = notification.department.trim().toLowerCase();
    const userDept = (context.department ?? "").trim().toLowerCase();
    const assigned = (notification.assignedEmployee ?? "").trim().toLowerCase();
    const userName = (context.employeeName ?? "").trim().toLowerCase();
    const sameDept = !dept || dept === "workshop" || (userDept !== "" && dept === userDept);
    const sameAssignee = assigned !== "" && userName !== "" && assigned === userName;
    return sameDept || sameAssignee;
  }
  return true;
}

export function createJobCardStatusNotification(input: {
  job: JobCard;
  previousStatus: string;
  newStatus: string;
  actor: string;
  vehicleLabel?: string;
  createdAtMs?: number;
  timestamp?: string;
}): JobCardNotification | null {
  const prev = input.previousStatus.trim();
  const next = input.newStatus.trim();
  if (!next || prev.toLowerCase() === next.toLowerCase()) {
    return null;
  }

  const createdAtMs = input.createdAtMs ?? Date.now();
  const timestamp = input.timestamp ?? formatAuditTimestamp(new Date(createdAtMs));
  const department = input.job.department?.trim() || "Workshop";
  const { targetRoles, targetAudience } = getNotificationAudience(input.job, prev, next);
  const vehiclePrefix = input.vehicleLabel ? `${input.vehicleLabel} · ` : "";
  const assigneePart = input.job.assignedEmployee ? ` (${input.job.assignedEmployee})` : "";

  return {
    id: `notif-${input.job.id}-${createdAtMs}-${Math.random().toString(36).slice(2, 6)}`,
    jobId: input.job.id,
    vehicleId: input.job.vehicleId,
    ...(input.vehicleLabel ? { vehicleLabel: input.vehicleLabel } : {}),
    department,
    previousStatus: prev || "Pending",
    newStatus: next,
    title: `Job Card ${input.job.id} · ${prev || "Pending"} → ${next}`,
    message: `${vehiclePrefix}${department}${assigneePart} moved from "${prev || "Pending"}" to "${next}" by ${input.actor}.`,
    actor: input.actor,
    targetAudience,
    targetRoles,
    ...(input.job.assignedEmployee ? { assignedEmployee: input.job.assignedEmployee } : {}),
    timestamp,
    createdAtMs,
    read: false,
  };
}

export function dispatchBrowserNotification(
  notification: JobCardNotification,
  options?: {
    NotificationCtor?: typeof Notification;
    onDesktopSent?: () => void;
    onFallbackAlert?: (notification: JobCardNotification) => void;
  },
): boolean {
  const Ctor =
    options?.NotificationCtor ??
    (typeof window !== "undefined" && typeof Notification !== "undefined"
      ? Notification
      : undefined);

  let sentDesktop = false;
  if (Ctor && Ctor.permission === "granted") {
    try {
      new Ctor(notification.title, {
        body: `${notification.message} Notifying: ${notification.targetAudience}`,
        tag: `job-card-status-${notification.jobId}`,
      });
      sentDesktop = true;
      options?.onDesktopSent?.();
    } catch {
      sentDesktop = false;
    }
  }

  options?.onFallbackAlert?.(notification);
  return sentDesktop;
}
