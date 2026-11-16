import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "./workspace-context";
import { departments, type WorkspaceRole } from "@/lib/workshop";
import { getDefaultHomeForRole } from "@/lib/route-guard";
import { toast } from "sonner";
import { Wrench, Shield, Briefcase, UserCheck, ArrowLeft, ArrowRight } from "./fa-icons";
import { cn } from "@/lib/utils";

const dashboardOptions: Array<{
  role: WorkspaceRole;
  title: string;
  description: string;
  icon: typeof Wrench;
}> = [
  {
    role: "Foreman",
    title: "Foreman",
    description: "Intake, job cards & shop floor",
    icon: Wrench,
  },
  {
    role: "Director",
    title: "Director",
    description: "Business overview & approvals",
    icon: Shield,
  },
  {
    role: "Management",
    title: "Management",
    description: "Operations, dispatch & reports",
    icon: Briefcase,
  },
  {
    role: "Employee",
    title: "Employee",
    description: "Department tasks & requisitions",
    icon: UserCheck,
  },
];

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

  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"role" | "department">("role");
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>("Foreman");
  const [selectedDept, setSelectedDept] = useState<string>("Mechanical");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showOnboarding) {
      setStep("role");
    }
  }, [showOnboarding]);

  useEffect(() => {
    if (currentUser?.role) {
      setSelectedRole(currentUser.role);
    } else if (role) {
      setSelectedRole(role);
    }
  }, [currentUser, role]);

  function completeSetup() {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("hi_rider_pending_onboarding");
      localStorage.setItem("hi_rider_onboarded", "true");
      localStorage.setItem("hi_rider_role", selectedRole);
      if (selectedRole === "Employee") {
        localStorage.setItem("hi_rider_department", selectedDept);
      }
      if (currentUser?.email) {
        try {
          const map = JSON.parse(localStorage.getItem("hi_rider_account_roles") || "{}") as Record<
            string,
            { role: WorkspaceRole; department?: string }
          >;
          map[currentUser.email.toLowerCase()] = {
            role: selectedRole,
            ...(selectedRole === "Employee" ? { department: selectedDept } : {}),
          };
          localStorage.setItem("hi_rider_account_roles", JSON.stringify(map));
        } catch {
          // ignore storage errors
        }
      }
    }

    setRole(selectedRole);
    if (selectedRole === "Employee") {
      setEmployeeDepartment(selectedDept);
    }

    setShowOnboarding(false);
    void navigate({ to: getDefaultHomeForRole(selectedRole), replace: true });

    const greetingName = currentUser?.displayName || "User";
    const deptInfo = selectedRole === "Employee" ? ` (${selectedDept})` : "";
    toast.success(`Welcome ${greetingName}! Connected to ${selectedRole} Dashboard${deptInfo}.`);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === "role" && selectedRole === "Employee") {
      setStep("department");
      return;
    }
    completeSetup();
  }

  if (!mounted || !showOnboarding || !isAuthenticated) return null;

  const firstName = currentUser?.displayName?.trim().split(/\s+/)[0];
  const headingText = firstName ? `Welcome, ${firstName}` : "Welcome to the Workshop";

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 max-w-lg w-full space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <h2 id="onboarding-title" className="text-lg font-semibold text-foreground">
              {headingText}
            </h2>
            <p className="text-sm text-muted-foreground">
              {step === "role"
                ? "Choose the workspace that fits your role."
                : "Select your workshop department to continue."}
            </p>
          </div>
          {selectedRole === "Employee" && (
            <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0 pt-1">
              {step === "role" ? "Step 1 of 2" : "Step 2 of 2"}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === "role" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dashboardOptions.map(({ role: r, title, description, icon: Icon }) => {
                const isSelected = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    aria-pressed={isSelected}
                    className={cn(
                      "p-4 rounded-xl border text-left cursor-pointer flex flex-col gap-2",
                      isSelected
                        ? "border-primary bg-primary/[0.06] text-foreground"
                        : "border-border bg-background hover:border-slate-300 hover:bg-muted/40 text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={18}
                        className={isSelected ? "text-primary" : "text-muted-foreground"}
                      />
                      <span className="font-semibold text-sm">{title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">{description}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {departments.map((dept) => {
                const isDeptSelected = selectedDept === dept;
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDept(dept)}
                    aria-pressed={isDeptSelected}
                    className={cn(
                      "px-4 py-3 rounded-xl border text-sm font-medium cursor-pointer text-left",
                      isDeptSelected
                        ? "border-primary bg-primary/[0.06] text-primary"
                        : "border-border bg-background text-foreground hover:border-slate-300 hover:bg-muted/40",
                    )}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            {step === "department" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("role")}
                className="h-11 px-4 text-sm font-medium rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 h-11 text-sm font-medium rounded-xl cursor-pointer flex items-center justify-center gap-2"
            >
              <span>
                {step === "role" && selectedRole === "Employee"
                  ? "Continue"
                  : `Enter ${selectedRole} Workspace`}
              </span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
