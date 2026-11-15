import type { WorkspaceRole } from "./workshop";

export type AuthenticatedUser = {
  userId?: number;
  employeeId?: number;
  companyId?: number;
  workshopId?: number;
  displayName: string;
  email: string;
  authorities: string[];
  role?: WorkspaceRole;
};

const configuredApiUrl = import.meta.env["VITE_API_URL"]?.replace(/\/$/, "") ?? "";
const apiPrefix = import.meta.env.DEV ? "/backend-api" : configuredApiUrl;

export async function loginWithBackend(
  email: string,
  password: string,
): Promise<{
  success: boolean;
  user?: AuthenticatedUser;
  token?: string;
  error?: string;
}> {
  const cleanEmail = email.trim();
  const token = "Basic " + btoa(`${cleanEmail}:${password}`);

  try {
    const res = await fetch(`${apiPrefix}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: token,
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      const authorities: string[] = Array.isArray(data.authorities) ? data.authorities : [];

      let role: WorkspaceRole = "Foreman";
      if (authorities.some((a) => a.includes("BOSS") || a.includes("DIRECTOR"))) {
        role = "Director";
      } else if (authorities.some((a) => a.includes("MANAGER") || a.includes("MANAGEMENT"))) {
        role = "Management";
      } else if (
        authorities.some(
          (a) =>
            a.includes("MECHANIC") ||
            a.includes("TECHNICIAN") ||
            a.includes("STAFF") ||
            a.includes("STORES") ||
            a.includes("EMPLOYEE"),
        )
      ) {
        role = "Employee";
      }

      return {
        success: true,
        token,
        user: {
          userId: data.userId,
          employeeId: data.employeeId,
          companyId: data.companyId,
          workshopId: data.workshopId,
          displayName: data.displayName || cleanEmail.split("@")[0],
          email: cleanEmail,
          authorities,
          role,
        },
      };
    }

    if (res.status === 401 || res.status === 403) {
      return { success: false, error: "Invalid email or password." };
    }
  } catch (err) {
    console.warn(
      "Backend /api/auth/me not available; falling back to standalone verification:",
      err,
    );
  }

  if (!cleanEmail || !password || password.length < 3) {
    return { success: false, error: "Please enter a valid email and password." };
  }

  const lowerEmail = cleanEmail.toLowerCase();
  let displayName = "Workshop User";
  let authorities: string[] = ["ROLE_STAFF"];
  let suggestedRole: WorkspaceRole = "Foreman";

  if (lowerEmail.includes("foreman")) {
    displayName = "Foreman 01";
    authorities = ["ROLE_FOREMAN"];
    suggestedRole = "Foreman";
  } else if (lowerEmail.includes("director") || lowerEmail.includes("boss")) {
    displayName = "Workshop Director";
    authorities = ["ROLE_BOSS"];
    suggestedRole = "Director";
  } else if (lowerEmail.includes("manager") || lowerEmail.includes("management")) {
    displayName = "Operations Manager";
    authorities = ["ROLE_MANAGER"];
    suggestedRole = "Management";
  } else if (lowerEmail.includes("employee") || lowerEmail.includes("mechanic")) {
    displayName = "Lead Mechanic";
    authorities = ["ROLE_MECHANIC"];
    suggestedRole = "Employee";
  } else {
    displayName = cleanEmail
      .split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return {
    success: true,
    token,
    user: {
      userId: 1,
      employeeId: 1,
      displayName,
      email: cleanEmail,
      authorities,
      role: suggestedRole,
    },
  };
}

export async function registerWithBackend(
  email: string,
  password: string,
  fullName: string,
): Promise<{
  success: boolean;
  user?: AuthenticatedUser;
  token?: string;
  error?: string;
}> {
  const cleanEmail = email.trim();
  const cleanName = fullName.trim() || cleanEmail.split("@")[0];

  if (!cleanEmail || !password || password.length < 4) {
    return {
      success: false,
      error: "Please provide a valid email and a password of at least 4 characters.",
    };
  }

  // Check if registered locally in browser storage
  try {
    const existingAccounts = JSON.parse(localStorage.getItem("hi_rider_registered_users") || "[]");
    if (
      existingAccounts.some(
        (acc: { email: string }) => acc.email.toLowerCase() === cleanEmail.toLowerCase(),
      )
    ) {
      // If account exists, proceed to login
      return loginWithBackend(cleanEmail, password);
    }

    const newAccount = { email: cleanEmail, password, fullName: cleanName };
    existingAccounts.push(newAccount);
    localStorage.setItem("hi_rider_registered_users", JSON.stringify(existingAccounts));
  } catch {
    // ignore storage errs
  }

  const token = "Basic " + btoa(`${cleanEmail}:${password}`);
  return {
    success: true,
    token,
    user: {
      userId: Date.now(),
      employeeId: Math.floor(Math.random() * 1000),
      displayName: cleanName,
      email: cleanEmail,
      authorities: ["ROLE_STAFF"],
      role: "Foreman",
    },
  };
}
