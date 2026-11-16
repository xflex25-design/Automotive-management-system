import type {
  WorkspaceRole,
  Vehicle,
  Quotation,
  InventoryCard,
  JobCard,
  Requisition,
  Inspection,
} from "./workshop";
import type { AuthenticatedUser } from "./auth";

export interface DatabaseSchema {
  version: number;
  users: Array<{
    email: string;
    password: string;
    fullName: string;
    role?: WorkspaceRole;
    department?: string;
  }>;
  vehicles: Vehicle[];
  quotations: Quotation[];
  inventory: InventoryCard[];
  jobs: JobCard[];
  requisitions: Requisition[];
  inspections: Inspection[];
  accountRoles: Record<string, { role: WorkspaceRole; department?: string }>;
}

const CURRENT_DB_VERSION = 1;
const DB_STORAGE_KEY = "hi_rider_central_db_v1";

export function getCentralDatabase(): DatabaseSchema {
  if (typeof window === "undefined" || !window.localStorage) {
    return getDefaultDatabase();
  }
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DatabaseSchema;
      if (parsed && typeof parsed === "object" && parsed.version === CURRENT_DB_VERSION) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load central database, falling back to migration:", err);
  }
  return migrateAndSaveDatabase();
}

export function saveCentralDatabase(db: Partial<DatabaseSchema>): DatabaseSchema {
  const current = getCentralDatabase();
  const updated: DatabaseSchema = {
    ...current,
    ...db,
    version: CURRENT_DB_VERSION,
  };

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(updated));
      // Sync individual collection keys for backward compatibility with existing components
      localStorage.setItem("hi_rider_registered_users", JSON.stringify(updated.users));
      localStorage.setItem("hi_rider_vehicles", JSON.stringify(updated.vehicles));
      localStorage.setItem("hi_rider_quotations", JSON.stringify(updated.quotations));
      localStorage.setItem("hi_rider_inventory", JSON.stringify(updated.inventory));
      localStorage.setItem("hi_rider_jobs", JSON.stringify(updated.jobs));
      localStorage.setItem("hi_rider_requisitions", JSON.stringify(updated.requisitions));
      localStorage.setItem("hi_rider_inspections", JSON.stringify(updated.inspections));
      localStorage.setItem("hi_rider_account_roles", JSON.stringify(updated.accountRoles));
    } catch (err) {
      console.warn("Failed to persist central database to localStorage:", err);
    }
  }
  return updated;
}

export function migrateAndSaveDatabase(): DatabaseSchema {
  const defaultDb = getDefaultDatabase();
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      // Migrate legacy individual keys if present
      const legacyUsers = JSON.parse(localStorage.getItem("hi_rider_registered_users") || "[]");
      const legacyVehicles = JSON.parse(localStorage.getItem("hi_rider_vehicles") || "[]");
      const legacyQuotations = JSON.parse(localStorage.getItem("hi_rider_quotations") || "[]");
      const legacyInventory = JSON.parse(localStorage.getItem("hi_rider_inventory") || "[]");
      const legacyJobs = JSON.parse(localStorage.getItem("hi_rider_jobs") || "[]");
      const legacyRequisitions = JSON.parse(localStorage.getItem("hi_rider_requisitions") || "[]");
      const legacyInspections = JSON.parse(localStorage.getItem("hi_rider_inspections") || "[]");
      const legacyRoles = JSON.parse(localStorage.getItem("hi_rider_account_roles") || "{}");

      const migrated: DatabaseSchema = {
        version: CURRENT_DB_VERSION,
        users: legacyUsers.length > 0 ? legacyUsers : defaultDb.users,
        vehicles: legacyVehicles.length > 0 ? legacyVehicles : defaultDb.vehicles,
        quotations: legacyQuotations.length > 0 ? legacyQuotations : defaultDb.quotations,
        inventory: legacyInventory.length > 0 ? legacyInventory : defaultDb.inventory,
        jobs: legacyJobs.length > 0 ? legacyJobs : defaultDb.jobs,
        requisitions: legacyRequisitions.length > 0 ? legacyRequisitions : defaultDb.requisitions,
        inspections: legacyInspections.length > 0 ? legacyInspections : defaultDb.inspections,
        accountRoles: Object.keys(legacyRoles).length > 0 ? legacyRoles : defaultDb.accountRoles,
      };

      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch (err) {
      console.warn("Migration failed, using default database:", err);
    }
  }
  return defaultDb;
}

function getDefaultDatabase(): DatabaseSchema {
  return {
    version: CURRENT_DB_VERSION,
    users: [
      {
        email: "foreman@hirider.test",
        password: "Workshop123!",
        fullName: "Foreman 01",
        role: "Foreman",
      },
      {
        email: "director@hirider.test",
        password: "Workshop123!",
        fullName: "Workshop Director",
        role: "Director",
      },
      {
        email: "manager@hirider.test",
        password: "Workshop123!",
        fullName: "Operations Manager",
        role: "Management",
      },
      {
        email: "employee@hirider.test",
        password: "Workshop123!",
        fullName: "Lead Mechanic",
        role: "Employee",
        department: "Mechanical",
      },
    ],
    vehicles: [],
    quotations: [],
    inventory: [],
    jobs: [],
    requisitions: [],
    inspections: [],
    accountRoles: {},
  };
}

export function verifyUserCredentials(
  email: string,
  pass: string,
): { success: boolean; user?: AuthenticatedUser; error?: string } {
  const db = getCentralDatabase();
  const cleanEmail = email.trim().toLowerCase();
  const found = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    return { success: false, error: "Account not found. Please register or check your email." };
  }

  if (found.password !== pass) {
    return { success: false, error: "Invalid password. Please try again." };
  }

  const role: WorkspaceRole = found.role || "Foreman";
  const user: AuthenticatedUser = {
    userId: 1,
    employeeId: 1,
    displayName: found.fullName,
    email: found.email,
    authorities: [
      role === "Director"
        ? "ROLE_BOSS"
        : role === "Management"
          ? "ROLE_MANAGER"
          : role === "Employee"
            ? "ROLE_MECHANIC"
            : "ROLE_FOREMAN",
    ],
    role,
  };

  return { success: true, user };
}

export function registerUserInDatabase(
  email: string,
  pass: string,
  fullName: string,
): { success: boolean; user?: AuthenticatedUser; error?: string } {
  const db = getCentralDatabase();
  const cleanEmail = email.trim();
  const cleanName = fullName.trim() || cleanEmail.split("@")[0];

  if (!cleanEmail || !pass || pass.length < 4) {
    return {
      success: false,
      error: "Please provide a valid email and a password of at least 4 characters.",
    };
  }

  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail.toLowerCase())) {
    return {
      success: false,
      error: "An account with this email already exists. Please login instead.",
    };
  }

  const newUser = {
    email: cleanEmail,
    password: pass,
    fullName: cleanName,
    role: "Foreman" as WorkspaceRole,
  };
  db.users.push(newUser);
  saveCentralDatabase(db);

  const user: AuthenticatedUser = {
    userId: Date.now(),
    employeeId: Math.floor(Math.random() * 1000),
    displayName: cleanName,
    email: cleanEmail,
    authorities: ["ROLE_STAFF"],
    role: "Foreman",
  };

  return { success: true, user };
}
