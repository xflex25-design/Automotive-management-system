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
export const sampleVehicles: Vehicle[] = [
  {
    id: "VR-1068",
    plate: "BCA 4821",
    make: "Toyota Hilux",
    customer: "John Musaku",
    phone: "+260 977 452 180",
    email: "john@example.com",
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
    customer: "Sarah Dlamini",
    phone: "+260 966 310 452",
    email: "sarah@example.com",
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
    customer: "David Phiri",
    phone: "+260 955 210 780",
    email: "david@example.com",
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
    customer: "Mary Banda",
    phone: "+260 977 112 400",
    email: "mary@example.com",
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
    customer: "Peter Mwila",
    phone: "+260 966 310 895",
    email: "peter@example.com",
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
    customer: "Grace Tembo",
    phone: "+260 955 326 112",
    email: "grace@example.com",
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
    customer: "James Chanda",
    phone: "+260 977 283 924",
    email: "james@example.com",
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
    customer: "Esther Zulu",
    phone: "+260 966 183 610",
    email: "esther@example.com",
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
export const sampleQuotations: Quotation[] = [
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
export const sampleInventory: InventoryCard[] = [
  {
    id: "IC-0451",
    vehicleId: "VR-1068",
    items: "Spare wheel, jack, wheel spanner, radio, floor mats",
    condition: "All items accounted for; spare wheel in good condition",
    date: "10 Nov 2026",
  },
  {
    id: "IC-0450",
    vehicleId: "VR-1066",
    items: "Spare wheel, jack, toolbox, floor mats",
    condition: "Toolbox lid damaged; photographed at intake",
    date: "10 Nov 2026",
  },
  {
    id: "IC-0449",
    vehicleId: "VR-1065",
    items: "Spare wheel, jack, radio, seat covers",
    condition: "All items in good condition",
    date: "10 Nov 2026",
  },
];
export const sampleJobs: JobCard[] = [
  {
    id: "JC-0881",
    vehicleId: "VR-1068",
    department: "Mechanical",
    work: "Replace front brake pads and inspect suspension",
    status: "In progress",
    due: "13 Nov 2026",
  },
  {
    id: "JC-0880",
    vehicleId: "VR-1066",
    department: "Mechanical",
    work: "Replace both rear shock absorbers",
    status: "Awaiting parts",
    due: "14 Nov 2026",
  },
  {
    id: "JC-0879",
    vehicleId: "VR-1065",
    department: "Fitting",
    work: "Replace windscreen and adjust door fittings",
    status: "Complete",
    due: "12 Nov 2026",
  },
  {
    id: "JC-0878",
    vehicleId: "VR-1064",
    department: "Panel Beating",
    work: "Repair rear quarter panel",
    status: "Awaiting parts",
    due: "10 Nov 2026",
  },
  {
    id: "JC-0877",
    vehicleId: "VR-1062",
    department: "Sanding",
    work: "Prepare bonnet and doors for respray",
    status: "In progress",
    due: "13 Nov 2026",
  },
];
export const sampleRequisitions: Requisition[] = [
  {
    id: "PR-0451",
    vehicleId: "VR-1066",
    part: "Rear shock absorber",
    quantity: 2,
    department: "Mechanical",
    reason: "Both rear shock absorbers are leaking. Replacement required for safe handling.",
    amount: 3800,
    foreman: "Foreman 01",
    status: "Pending",
    date: "11 Nov 2026",
  },
  {
    id: "PR-0450",
    vehicleId: "VR-1068",
    part: "Front brake pad set",
    quantity: 1,
    department: "Mechanical",
    reason: "Brake pads below minimum wear limit. Customer reported brake squeal.",
    amount: 1250,
    foreman: "Foreman 01",
    status: "Pending",
    date: "11 Nov 2026",
  },
  {
    id: "PR-0449",
    vehicleId: "VR-1065",
    part: "Windscreen seal",
    quantity: 1,
    department: "Fitting",
    reason: "Existing seal split during inspection; new seal needed for a watertight fit.",
    amount: 650,
    foreman: "Foreman 03",
    status: "Approved",
    date: "10 Nov 2026",
  },
  {
    id: "PR-0448",
    vehicleId: "VR-1064",
    part: "Rear quarter panel",
    quantity: 1,
    department: "Panel Beating",
    reason: "Panel damage exceeds repairable tolerances; replacement authorized in quotation.",
    amount: 4200,
    foreman: "Foreman 04",
    status: "Ordered",
    date: "09 Nov 2026",
  },
  {
    id: "PR-0447",
    vehicleId: "VR-1068",
    part: "Suspension bush kit",
    quantity: 2,
    department: "Mechanical",
    reason: "Replace worn suspension bushes.",
    amount: 1800,
    foreman: "Foreman 01",
    status: "Dispatched",
    date: "09 Nov 2026",
  },
  {
    id: "PR-0446",
    vehicleId: "VR-1062",
    part: "Sanding disc pack",
    quantity: 3,
    department: "Sanding",
    reason: "Surface preparation before painting.",
    amount: 540,
    foreman: "Foreman 04",
    status: "Rejected",
    decisionNote: "Use available workshop stock before ordering.",
    date: "09 Nov 2026",
  },
];
export const sampleInspections: Inspection[] = [
  {
    id: "IN-0212",
    vehicleId: "VR-1065",
    foreman: "Foreman 03",
    date: "11 Nov 2026",
    result: "Passed",
    notes: "Windscreen seal tested; fittings secure. Final road test passed.",
  },
  {
    id: "IN-0211",
    vehicleId: "VR-1063",
    foreman: "Foreman 02",
    date: "10 Nov 2026",
    result: "Passed",
    notes: "Paint finish checked and approved. Vehicle ready for release authorization.",
  },
];
export const departmentStats = [
  { name: "Mechanical", active: 12, completed: 18, pending: 4, delays: 2, efficiency: 82 },
  { name: "Panel Beating", active: 8, completed: 12, pending: 3, delays: 2, efficiency: 74 },
  { name: "Fitting", active: 6, completed: 14, pending: 2, delays: 0, efficiency: 91 },
  { name: "Painting", active: 5, completed: 9, pending: 2, delays: 1, efficiency: 85 },
  { name: "Sanding", active: 4, completed: 11, pending: 1, delays: 1, efficiency: 88 },
];
