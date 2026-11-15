import { useRef, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Car,
  FileText,
  Archive,
  ClipboardList,
  Package,
  Wrench,
  ClipboardCheck,
  FolderOpen,
  ChartNoAxesColumnIncreasing,
  GitBranch,
  ShieldCheck,
  Search,
  ChevronDown,
  Menu,
  X,
  Bell,
  MessageSquare,
  Settings,
  UserRound,
  LogOut,
  Download,
} from "./fa-icons";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "./workspace-context";
import { type WorkspaceRole } from "@/lib/workshop";

const operationalLinks = [
  { title: "Vehicle Registration", to: "/registration", icon: Car },
  { title: "Quotations", to: "/quotations", icon: FileText },
  { title: "Inventory Cards", to: "/inventory", icon: Archive },
  { title: "Job Cards", to: "/job-cards", icon: ClipboardList },
  { title: "Parts Requisitions", to: "/requisitions", icon: Package },
  { title: "Workshop Progress", to: "/workshop", icon: Wrench },
  { title: "Inspections", to: "/inspections", icon: ClipboardCheck },
  { title: "Vehicle Records", to: "/vehicles", icon: FolderOpen },
] as const;
const oversightLinks = [
  { title: "Vehicle Overview", to: "/vehicles", icon: Car },
  { title: "Quotations", to: "/quotations", icon: FileText },
  { title: "Inventory Cards", to: "/inventory", icon: Archive },
  { title: "Job Cards", to: "/job-cards", icon: ClipboardList },
  { title: "Workflow Tracking", to: "/workflow", icon: GitBranch },
  { title: "Workshop Progress", to: "/workshop", icon: Wrench },
  { title: "Department Performance", to: "/departments", icon: ChartNoAxesColumnIncreasing },
  { title: "Parts Requisitions", to: "/requisitions", icon: Package },
  { title: "Procurement & Dispatch", to: "/procurement", icon: Archive },
  { title: "Inspection Results", to: "/inspections", icon: ClipboardCheck },
] as const;
const employeeLinks = [
  { title: "Employee Dashboard", to: "/employee", icon: LayoutDashboard },
  { title: "Job Cards", to: "/job-cards", icon: ClipboardList },
  { title: "Parts Requisitions", to: "/requisitions", icon: Package },
  { title: "Workshop Progress", to: "/workshop", icon: Wrench },
] as const;
export function AppShell({ children }: { children: ReactNode }) {
  const {
    role: selectedRole,
    foreman,
    employeeDepartment,
    search,
    setSearch,
    requisitions,
    logout,
    setShowOnboarding,
    currentUser,
  } = useWorkspace();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role: WorkspaceRole =
    pathname === "/management"
      ? "Management"
      : pathname === "/director" || pathname === "/approvals"
        ? "Director"
        : pathname === "/employee"
          ? "Employee"
          : pathname === "/"
            ? "Foreman"
            : selectedRole;
  const pageTitle =
    pathname === "/management"
      ? "Management Dashboard"
      : pathname === "/director" || pathname === "/approvals"
        ? "Director Dashboard"
        : pathname === "/employee"
          ? "Employee Dashboard"
          : pathname === "/"
            ? "Foreman Dashboard"
            : (pathname.split("/").filter(Boolean).at(-1) ?? "Workshop")
                .replaceAll("-", " ")
                .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const profileLabel =
    role === "Foreman" ? foreman : role === "Employee" ? employeeDepartment : role;
  const initials = profileLabel
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const [open, setOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDetailsElement>(null);
  const closeProfileMenu = () => {
    if (profileMenuRef.current) profileMenuRef.current.open = false;
  };
  const [searchScope, setSearchScope] = useState<
    "/vehicles" | "/quotations" | "/job-cards" | "/requisitions" | "/inspections"
  >("/vehicles");
  const navigate = useNavigate();
  const home =
    role === "Management"
      ? "/management"
      : role === "Director"
        ? "/director"
        : role === "Employee"
          ? "/employee"
          : "/";
  const pending = requisitions.filter((r) => r.status === "Pending").length;
  const links =
    role === "Foreman" ? operationalLinks : role === "Employee" ? employeeLinks : oversightLinks;
  return (
    <div className="app-shell">
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
      <aside className={`app-sidebar ${open ? "sidebar-open" : ""}`}>
        <Button
          className="mobile-close"
          variant="navigation"
          size="icon"
          title="Close navigation"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        >
          <X />
        </Button>
        <div className="brand">
          <img
            src="/hirider-logo-official.jpeg"
            alt="Hi Rider 4x4 World Logo"
            className="brand-logo"
          />
          <div className="brand-text">
            <div className="brand-name">Hi Rider 4x4 World</div>
            <div className="brand-subtitle">VEHICLE GARAGE MANAGEMENT</div>
          </div>
        </div>
        <div className="sidebar-dashboard-wrap">
          <Link
            to={home}
            activeOptions={{ exact: true }}
            className="sidebar-dashboard-link"
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard />
            Dashboard
          </Link>
        </div>
        <div className="sidebar-label">
          {role === "Foreman" ? "Workshop workspace" : "Business workspace"}
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {role === "Director" && (
            <Link to="/approvals" className="sidebar-link" onClick={() => setOpen(false)}>
              <ShieldCheck />
              Parts Approvals
              <span className="ml-auto inline-flex items-center justify-center rounded-full bg-white text-xs font-medium tabular-nums text-blue-700 px-2 py-0.5 leading-none">
                {pending}
              </span>
            </Link>
          )}
          {links.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="sidebar-link"
              onClick={() => setOpen(false)}
            >
              <item.icon />
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <a
            href="/automotive-management-system-updated.zip?v=2"
            download="automotive-management-system-updated.zip"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-white hover:bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition cursor-pointer"
          >
            <Download size={15} />
            Download Zip
          </a>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-topbar">
          <div className="topbar-brand">
            <Button
              variant="navigation"
              size="icon"
              className="mobile-menu"
              aria-label="Open navigation"
              title="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </Button>
            <img
              className="topbar-logo"
              src="/hirider-logo-official.jpeg"
              alt="Hi Rider 4x4 World"
            />
            <span className="topbar-divider" />
            <h1 className="topbar-page-title">{pageTitle}</h1>
          </div>
          <form
            className="global-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: searchScope });
            }}
          >
            <div className="global-search-scope">
              <select
                aria-label="Search scope"
                value={searchScope}
                onChange={(e) =>
                  setSearchScope(
                    e.target.value as
                      "/vehicles" | "/quotations" | "/job-cards" | "/requisitions" | "/inspections",
                  )
                }
              >
                <option value="/vehicles">All records</option>
                <option value="/quotations">Quotations</option>
                <option value="/job-cards">Job cards</option>
                <option value="/requisitions">Parts</option>
                <option value="/inspections">Inspections</option>
              </select>
              <ChevronDown size={11} className="global-search-scope-icon" aria-hidden="true" />
            </div>
            <div className="global-search-field">
              <Search size={14} className="global-search-icon" aria-hidden="true" />
              <input
                aria-label="Search vehicles, customers, quotations, job cards"
                placeholder="Search vehicles, customers, quotations, job cards..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="global-search-clear"
                  aria-label="Clear search"
                  title="Clear search"
                  onClick={() => setSearch("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button type="submit" className="global-search-submit" aria-label="Submit search">
              <Search size={13} aria-hidden="true" />
              <span className="global-search-submit-label">Search</span>
            </button>
          </form>
          <div className="topbar-actions">
            <button
              type="button"
              className="topbar-action"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={19} />
              <span className="topbar-notification-badge" />
            </button>
            <button
              type="button"
              className="topbar-action topbar-optional-action"
              aria-label="Messages"
              title="Messages"
            >
              <MessageSquare size={19} />
            </button>
            <Link
              to="/settings"
              className="topbar-action topbar-optional-action"
              aria-label="Settings"
              title="Settings"
            >
              <Settings size={19} />
            </Link>
            <details className="topbar-profile" ref={profileMenuRef}>
              <summary
                className="topbar-action topbar-profile-trigger"
                aria-label="User profile menu"
              >
                <span className="topbar-avatar">{initials || "U"}</span>
              </summary>
              <div className="topbar-profile-menu">
                {currentUser?.email && (
                  <div className="px-3 py-1.5 border-b border-border text-xs font-medium text-muted-foreground truncate tabular-nums">
                    {currentUser.email}
                  </div>
                )}
                <Link to="/profile" onClick={closeProfileMenu}>
                  <UserRound size={16} /> Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    closeProfileMenu();
                    setShowOnboarding(true);
                  }}
                  className="cursor-pointer"
                >
                  <LayoutDashboard size={16} /> Switch Dashboard
                </button>
                <Link to="/settings" onClick={closeProfileMenu}>
                  <Settings size={16} /> Account Settings
                </Link>
                <div className="topbar-menu-divider" />
                <button
                  type="button"
                  onClick={() => {
                    closeProfileMenu();
                    logout();
                  }}
                  className="cursor-pointer text-destructive hover:text-destructive"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </details>
          </div>
        </header>
        <main className="workspace">{children}</main>
      </div>
    </div>
  );
}
