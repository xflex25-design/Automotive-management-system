import type { WorkspaceRole } from "./workshop";
import { verifyUserCredentials, registerUserInDatabase } from "./database-sync";

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
  } catch (err) {
    console.warn(
      "Backend /api/auth/me not available; falling back to centralized database verification:",
      err,
    );
  }

  const result = verifyUserCredentials(cleanEmail, password);
  if (!result.success) {
    return { success: false, error: result.error || "Invalid email or password." };
  }

  return {
    success: true,
    token,
    user: result.user,
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

  const result = registerUserInDatabase(cleanEmail, password, cleanName);
  if (!result.success) {
    return { success: false, error: result.error || "Registration failed." };
  }

  const token = "Basic " + btoa(`${cleanEmail}:${password}`);
  return {
    success: true,
    token,
    user: result.user,
  };
}
