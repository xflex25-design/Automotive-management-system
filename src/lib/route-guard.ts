import { type WorkspaceRole } from "./workshop";

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isRouteAllowedForRole(pathname: string, role: WorkspaceRole): boolean {
  // Common account utility pages accessible to all authenticated roles
  if (matchesPrefix(pathname, ["/profile", "/settings", "/alerts", "/reports"])) {
    return true;
  }

  if (role === "Foreman") {
    if (pathname === "/") return true;
    const allowed = [
      "/registration",
      "/quotations",
      "/inventory",
      "/job-cards",
      "/requisitions",
      "/workshop",
      "/inspections",
      "/vehicles",
    ];
    return matchesPrefix(pathname, allowed);
  }

  if (role === "Director" || role === "Management") {
    // Director and Management share capabilities, while each is scoped to its own dashboard route
    const ownDashboard = role === "Director" ? "/director" : "/management";
    const allowed = [
      ownDashboard,
      "/approvals",
      "/vehicles",
      "/quotations",
      "/inventory",
      "/job-cards",
      "/workflow",
      "/workshop",
      "/departments",
      "/requisitions",
      "/procurement",
      "/inspections",
    ];
    return matchesPrefix(pathname, allowed);
  }

  if (role === "Employee") {
    const allowed = ["/employee", "/job-cards", "/requisitions", "/workshop"];
    return matchesPrefix(pathname, allowed);
  }

  return false;
}

export function getDefaultHomeForRole(role: WorkspaceRole): string {
  switch (role) {
    case "Director":
      return "/director";
    case "Management":
      return "/management";
    case "Employee":
      return "/employee";
    case "Foreman":
    default:
      return "/";
  }
}
