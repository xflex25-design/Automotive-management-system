import { useEffect, useRef, useState, type ReactNode } from "react";
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
  Check,
  MessageSquare,
  Settings,
  UserRound,
  LogOut,
  Download,
} from "./fa-icons";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "./workspace-context";
import { type WorkspaceRole } from "@/lib/workshop";
import { toast } from "sonner";
import { isRouteAllowedForRole, getDefaultHomeForRole } from "@/lib/route-guard";

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
    showOnboarding,
    currentUser,
    notifications,
    relevantNotifications,
    unreadNotificationCount,
    notificationPermission,
    enableBrowserNotifications,
    sendTestNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useWorkspace();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role: WorkspaceRole = selectedRole;
  const pageTitle =
    pathname === "/management"
      ? "Management Dashboard"
      : pathname === "/director"
        ? "Director Dashboard"
        : pathname === "/approvals"
          ? "Parts Approvals"
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationScope, setNotificationScope] = useState<"relevant" | "all">("all");
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDetailsElement>(null);
  const closeProfileMenu = () => {
    if (profileMenuRef.current) profileMenuRef.current.open = false;
  };
  useEffect(() => {
    if (!notificationsOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen]);
  const [searchScope, setSearchScope] = useState<
    "/vehicles" | "/quotations" | "/job-cards" | "/requisitions" | "/inspections"
  >("/vehicles");
  const navigate = useNavigate();
  useEffect(() => {
    if (pathname === "/login") {
      void navigate({ to: getDefaultHomeForRole(selectedRole), replace: true });
      return;
    }
    if (!isRouteAllowedForRole(pathname, selectedRole)) {
      if (!showOnboarding) {
        toast.error(
          `Access restricted: Your ${selectedRole} role does not have permission to view this page.`,
        );
      }
      void navigate({ to: getDefaultHomeForRole(selectedRole), replace: true });
    }
  }, [pathname, selectedRole, showOnboarding, navigate]);
  const displayedNotifications =
    notificationScope === "relevant" ? relevantNotifications : notifications;
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
          <img src="/hirider-logo-official.jpeg" alt="Workshop Logo" className="brand-logo" />
          <div className="brand-text">
            <div className="brand-name">Hi Rider</div>
            <div className="brand-subtitle">4x4 World</div>
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
          {(role === "Director" || role === "Management") && (
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
            <img className="topbar-logo" src="/hirider-logo-official.jpeg" alt="Workshop Logo" />
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
                {role === "Employee" ? (
                  <>
                    <option value="/job-cards">Job cards</option>
                    <option value="/requisitions">Parts</option>
                  </>
                ) : (
                  <>
                    <option value="/vehicles">All records</option>
                    <option value="/quotations">Quotations</option>
                    <option value="/job-cards">Job cards</option>
                    <option value="/requisitions">Parts</option>
                    <option value="/inspections">Inspections</option>
                  </>
                )}
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
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                className="topbar-action"
                aria-label={
                  unreadNotificationCount > 0
                    ? `Notifications (${unreadNotificationCount} unread)`
                    : "Notifications"
                }
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
                title="Notifications"
                onClick={() => setNotificationsOpen((prev) => !prev)}
              >
                <Bell size={19} />
                {unreadNotificationCount > 0 && (
                  <span
                    data-testid="notification-unread-badge"
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-semibold tabular-nums flex items-center justify-center border-2 border-background"
                  >
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  role="dialog"
                  aria-label="Job card notifications"
                  className="absolute right-0 top-12 z-50 w-[360px] max-w-[92vw] rounded-xl border border-border bg-background shadow-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
                    <div>
                      <div className="text-sm font-semibold text-foreground">Notifications</div>
                      <div className="text-[11px] text-muted-foreground">
                        {notificationPermission === "granted"
                          ? "Browser alerts enabled"
                          : notificationPermission === "denied"
                            ? "Browser alerts blocked"
                            : "In-app alerts active"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {notificationPermission === "default" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => void enableBrowserNotifications()}
                        >
                          Enable alerts
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={sendTestNotification}
                        title="Simulate a real-time status update"
                      >
                        <Bell size={11} className="mr-1" />
                        Test alert
                      </Button>
                      {unreadNotificationCount > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={markAllNotificationsRead}
                        >
                          <Check size={12} />
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border/60 bg-background">
                    <div
                      className="flex items-center gap-1"
                      role="group"
                      aria-label="Filter notifications"
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant={notificationScope === "relevant" ? "default" : "ghost"}
                        className="h-6 px-2 text-xs"
                        onClick={() => setNotificationScope("relevant")}
                      >
                        For me ({relevantNotifications.length})
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={notificationScope === "all" ? "default" : "ghost"}
                        className="h-6 px-2 text-xs"
                        onClick={() => setNotificationScope("all")}
                      >
                        All ({notifications.length})
                      </Button>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearNotifications}
                        className="text-[11px] font-medium text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60">
                    {displayedNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center space-y-2">
                        <p className="text-xs font-medium text-foreground">
                          No job card notifications yet
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Alerts appear automatically when job card statuses change (e.g. In Repair
                          to Completed).
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs"
                          onClick={sendTestNotification}
                        >
                          <Bell size={12} className="mr-1.5" />
                          Send test alert
                        </Button>
                      </div>
                    ) : (
                      displayedNotifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(item.id);
                            setNotificationsOpen(false);
                            void navigate({ to: "/job-cards" });
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer space-y-1 ${
                            item.read ? "opacity-75" : "bg-primary/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              {!item.read && (
                                <span
                                  aria-hidden="true"
                                  className="inline-block h-2 w-2 rounded-full bg-red-500 shrink-0"
                                />
                              )}
                              {item.title}
                            </span>
                            <time className="text-[10px] tabular-nums text-muted-foreground shrink-0">
                              {item.timestamp}
                            </time>
                          </div>
                          <p className="text-xs text-foreground/90 leading-snug">{item.message}</p>
                          <div className="text-[11px] text-muted-foreground">
                            Alerted: {item.targetAudience}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
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
        <main className="workspace">
          {isRouteAllowedForRole(pathname, selectedRole) ? children : null}
        </main>
      </div>
    </div>
  );
}
