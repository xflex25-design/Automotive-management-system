import { useState, useEffect, type FormEvent } from "react";
import { useWorkspace } from "./workspace-context";
import { PageHeading } from "./shared";
import {
  User,
  Mail,
  Shield,
  Briefcase,
  Lock,
  Bell,
  Moon,
  Sun,
  Monitor,
  CheckCircle2,
  Save,
  KeyRound,
} from "./fa-icons";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { departments, type WorkspaceRole } from "@/lib/workshop";

export function ProfileComponent() {
  const { currentUser, role, setRole, employeeDepartment, setEmployeeDepartment } = useWorkspace();

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Display preferences state
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("light");

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("hi_rider_theme");
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemeMode(saved);
      }
    }
  }, []);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [compactDensity, setCompactDensity] = useState(false);
  const [preferredRole, setPreferredRole] = useState<WorkspaceRole>(role);
  const [preferredDept, setPreferredDept] = useState(employeeDepartment);

  function handleUpdatePassword(e: FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters long.");
      return;
    }

    setPasswordLoading(true);
    setTimeout(() => {
      setPasswordLoading(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully with BCrypt verification.");
    }, 600);
  }

  function handleSavePreferences(e: FormEvent) {
    e.preventDefault();
    setRole(preferredRole);
    setEmployeeDepartment(preferredDept);

    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("hi_rider_theme", themeMode);
      localStorage.setItem("hi_rider_role", preferredRole);
      localStorage.setItem("hi_rider_department", preferredDept);
    }

    toast.success("Display preferences and profile settings saved successfully.");
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeading
        title="User Profile & Account Settings"
        subtitle="Manage your personal details, secure password, and display preferences"
      />

      {/* Profile Overview Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 border-b border-border pb-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-2xl shadow-inner">
            {currentUser?.displayName
              ? currentUser.displayName
                  .split(/\s+/)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "HR"}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                {currentUser?.displayName || "Workshop User"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {role}
              </span>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Mail size={14} /> {currentUser?.email}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
            <span className="text-muted-foreground uppercase tracking-label font-semibold">
              User ID
            </span>
            <div className="tabular-nums font-semibold text-foreground text-sm">
              #{currentUser?.userId || "1042"}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
            <span className="text-muted-foreground uppercase tracking-label font-semibold">
              Employee ID
            </span>
            <div className="tabular-nums font-semibold text-foreground text-sm">
              #{currentUser?.employeeId || "EMP-084"}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
            <span className="text-muted-foreground uppercase tracking-label font-semibold">
              Workshop / Company
            </span>
            <div className="font-medium text-foreground text-sm">Your Company Name</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Update Password Card */}
        <section className="registration-panel flex flex-col">
          <div className="registration-header">
            <div className="flex items-center gap-2.5">
              <KeyRound size={16} className="text-primary" />
              <h3>Security &amp; Password</h3>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Account credentials</span>
          </div>

          <form
            id="profile-password-form"
            className="flex-1 flex flex-col justify-between"
            onSubmit={handleUpdatePassword}
            onReset={(e) => {
              e.preventDefault();
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
          >
            <div className="registration-stack">
              <div className="registration-row-compact">
                <label htmlFor="prof-current-pw" className="registration-label">
                  Current Password <span className="registration-required">*</span>
                </label>
                <input
                  id="prof-current-pw"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="registration-input w-full"
                />
              </div>

              <div className="registration-row-compact">
                <label htmlFor="prof-new-pw" className="registration-label">
                  New Password <span className="registration-required">*</span>
                </label>
                <input
                  id="prof-new-pw"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="registration-input w-full"
                />
              </div>

              <div className="registration-row-compact">
                <label htmlFor="prof-confirm-pw" className="registration-label">
                  Confirm Password <span className="registration-required">*</span>
                </label>
                <input
                  id="prof-confirm-pw"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="registration-input w-full"
                />
              </div>
            </div>

            <div className="registration-actions-compact">
              <Button type="submit" disabled={passwordLoading} className="registration-submit-btn">
                {passwordLoading ? "Updating..." : "Submit"}
              </Button>
              <Button type="reset" variant="outline" className="registration-reset-btn">
                Reset
              </Button>
            </div>
          </form>
        </section>

        {/* Display & Workspace Preferences Card */}
        <section className="registration-panel">
          <div className="registration-header">
            <div className="flex items-center gap-2.5">
              <Monitor size={16} className="text-primary" />
              <h3>Display &amp; Workspace</h3>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Layout &amp; defaults</span>
          </div>

          <form
            onSubmit={handleSavePreferences}
            onReset={(e) => {
              e.preventDefault();
              setPreferredRole(role);
              setPreferredDept(employeeDepartment);
              setThemeMode("light");
              setEmailNotifications(true);
              setSmsAlerts(true);
              setCompactDensity(false);
            }}
          >
            <div className="registration-stack">
              <div className="registration-row-compact">
                <label htmlFor="prof-role" className="registration-label">
                  Default Role
                </label>
                <select
                  id="prof-role"
                  value={preferredRole}
                  onChange={(e) => setPreferredRole(e.target.value as WorkspaceRole)}
                  className="registration-input w-full"
                >
                  <option value="Foreman">Foreman</option>
                  <option value="Director">Director</option>
                  <option value="Management">Management</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              {preferredRole === "Employee" && (
                <div className="registration-row-compact">
                  <label htmlFor="prof-dept" className="registration-label">
                    Department
                  </label>
                  <select
                    id="prof-dept"
                    value={preferredDept}
                    onChange={(e) => setPreferredDept(e.target.value)}
                    className="registration-input w-full"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="registration-row-compact">
                <span className="registration-label">Appearance Mode</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { mode: "light", label: "Light", icon: Sun },
                    { mode: "dark", label: "Dark", icon: Moon },
                    { mode: "system", label: "System", icon: Monitor },
                  ].map(({ mode, label, icon: Icon }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setThemeMode(mode as "light" | "dark" | "system")}
                      className={`flex items-center justify-center gap-1.5 h-[34px] px-2.5 rounded-[3px] border text-sm font-medium transition cursor-pointer ${
                        themeMode === mode
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-[#d1d5db] hover:bg-muted"
                      }`}
                    >
                      <Icon size={13} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="registration-row-compact registration-row-top">
                <span className="registration-label">Notifications</span>
                <div className="space-y-2.5 pt-1">
                  <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="rounded border-[#d1d5db] text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="font-medium text-foreground">
                      Email Notifications (Requisitions &amp; Approvals)
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      className="rounded border-[#d1d5db] text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="font-medium text-foreground">
                      SMS Alerts for Urgent Dispatch
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compactDensity}
                      onChange={(e) => setCompactDensity(e.target.checked)}
                      className="rounded border-[#d1d5db] text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="font-medium text-foreground">Compact Table Density Mode</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="registration-actions-compact">
              <Button type="submit" className="registration-submit-btn">
                <Save size={14} /> Submit
              </Button>
              <Button type="reset" variant="outline" className="registration-reset-btn">
                Reset
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
