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
  return role === "Director";
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
  photos?: string[];
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
export const sampleVehicles: Vehicle[] = [];
export const sampleQuotations: Quotation[] = [];
export const sampleInventory: InventoryCard[] = [];
export const sampleJobs: JobCard[] = [];
export const sampleRequisitions: Requisition[] = [];
export const sampleInspections: Inspection[] = [];

export const departmentStats = [
  { name: "Mechanical", active: 12, completed: 18, pending: 4, delays: 2, efficiency: 82 },
  { name: "Panel Beating", active: 8, completed: 12, pending: 3, delays: 2, efficiency: 74 },
  { name: "Fitting", active: 6, completed: 14, pending: 2, delays: 0, efficiency: 91 },
  { name: "Painting", active: 5, completed: 9, pending: 2, delays: 1, efficiency: 85 },
  { name: "Sanding", active: 4, completed: 11, pending: 1, delays: 1, efficiency: 88 },
];
