import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "./workspace-context";
import { departments, type WorkspaceRole } from "@/lib/workshop";
import { toast } from "sonner";
import { Wrench, Shield, Briefcase, UserCheck, ArrowRight, CheckCircle2 } from "./fa-icons";

export function OnboardingModal() {
  const {
    role,
    setRole,
    setEmployeeDepartment,
    isAuthenticated,
    currentUser,
    showOnboarding,
    setShowOnboarding,
  } = useWorkspace();

  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>("Foreman");
  const [selectedDept, setSelectedDept] = useState<string>("Mechanical");

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined" || !window.localStorage) return;
    const onboarded = localStorage.getItem("hi_rider_onboarded");

    // Show if manually requested via showOnboarding OR if authenticated but not yet onboarded
    if (showOnboarding || (isAuthenticated && !onboarded)) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [showOnboarding, isAuthenticated]);

  useEffect(() => {
    if (currentUser?.role) {
      setSelectedRole(currentUser.role);
    } else if (role) {
      setSelectedRole(role);
    }
  }, [currentUser, role]);

  const dashboardOptions: Array<{
    role: WorkspaceRole;
    title: string;
    description: string;
    icon: typeof Wrench;
  }> = [
    {
      role: "Foreman",
      title: "Foreman Dashboard",
      description: "Intake, job cards, requisitions & shop floor oversight",
      icon: Wrench,
    },
    {
      role: "Director",
      title: "Director Dashboard",
      description: "Business overview & parts authorization queue",
      icon: Shield,
    },
    {
      role: "Management",
      title: "Manager Dashboard",
      description: "Department performance, procurement, invoices & reports",
      icon: Briefcase,
    },
    {
      role: "Employee",
      title: "Employee Dashboard",
      description: "Department work orders, task progress & technician scratchpad",
      icon: UserCheck,
    },
  ];

  function handleCompleteOnboarding(e: React.FormEvent) {
    e.preventDefault();
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("hi_rider_onboarded", "true");
      localStorage.setItem("hi_rider_role", selectedRole);
      if (selectedRole === "Employee") {
        localStorage.setItem("hi_rider_department", selectedDept);
      }
    }

    setRole(selectedRole);
    if (selectedRole === "Employee") {
      setEmployeeDepartment(selectedDept);
    }

    // Direct navigation to target dashboard
    if (selectedRole === "Management") {
      window.location.hash = "#management";
      if (window.location.pathname !== "/management") {
        window.history.pushState(null, "", "/management");
      }
    } else if (selectedRole === "Director") {
      window.location.hash = "#director";
      if (window.location.pathname !== "/director") {
        window.history.pushState(null, "", "/director");
      }
    } else if (selectedRole === "Employee") {
      window.location.hash = "#employee";
      if (window.location.pathname !== "/employee") {
        window.history.pushState(null, "", "/employee");
      }
    } else {
      window.location.hash = "#foreman";
      if (window.location.pathname !== "/") {
        window.history.pushState(null, "", "/");
      }
    }

    setShowModal(false);
    setShowOnboarding(false);

    const greetingName = currentUser?.displayName || "User";
    const deptInfo = selectedRole === "Employee" ? ` (${selectedDept})` : "";
    toast.success(`Welcome ${greetingName}! Connected to ${selectedRole} Dashboard${deptInfo}.`);
  }

  if (!mounted || !showModal || !isAuthenticated) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl p-7 max-w-xl w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Wrench size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Welcome to the Workshop</h2>
            <p className="text-sm text-muted-foreground">
              Select your dashboard to configure your workspace view
            </p>
          </div>
        </div>

        <form onSubmit={handleCompleteOnboarding} className="space-y-5">
          {/* 4 Dashboards Selection */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold uppercase tracking-label text-muted-foreground">
              Select Your Dashboard
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dashboardOptions.map(({ role: r, title, description, icon: Icon }) => {
                const isSelected = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/30 shadow-sm"
                        : "border-border bg-background hover:bg-accent/60 hover:border-muted-foreground/50 text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon
                          size={18}
                          className={isSelected ? "text-primary" : "text-muted-foreground"}
                        />
                        <span className="font-semibold text-sm">
                          {title.replace(" Dashboard", "")}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground leading-snug">
                      {description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Department Selection: Only displayed when Employee is selected */}
          {selectedRole === "Employee" && (
            <div className="p-4 rounded-xl bg-accent/40 border border-primary/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-primary" />
                <label className="block text-xs font-semibold uppercase tracking-label text-foreground">
                  Employee Department / Specialty
                </label>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose your workshop discipline to filter your work queue and task scratchpad:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {departments.map((dept) => {
                  const isDeptSelected = selectedDept === dept;
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setSelectedDept(dept)}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition cursor-pointer text-center ${
                        isDeptSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background text-foreground border-border hover:bg-accent"
                      }`}
                    >
                      {dept}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full py-3 text-sm font-medium rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Enter {selectedRole} Workspace</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
