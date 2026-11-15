import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  SlidersHorizontal,
  ClipboardList,
  Package,
  Wrench,
  ShieldCheck,
  Clock,
  FileText,
  Car,
  Truck,
  RotateCcw,
  GitBranch,
  CheckCircle2,
} from "./fa-icons";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWorkspace } from "./workspace-context";
import {
  PageHeading,
  SectionHeading,
  Metrics,
  metricIcons,
  DataTable,
  EmptyState,
  VehicleCell,
  Status,
  ProgressBar,
  LineChart,
  ExportButton,
  DateFilter,
  TableFooter,
  ViewAllVehicles,
} from "./shared";
import { VehicleDetail } from "./vehicle-detail";
import {
  workflowStages,
  nextSortState,
  sortRecords,
  type SortState,
  type WorkspaceRole,
} from "@/lib/workshop";

export function DepartmentCards() {
  const { workflows, loading } = useWorkspace();
  const departments = useMemo(() => {
    const orders = workflows.flatMap((plan) =>
      Array.isArray(plan["workOrders"]) ? (plan["workOrders"] as Record<string, unknown>[]) : [],
    );
    const grouped = new Map<string, Record<string, unknown>[]>();
    for (const order of orders) {
      const name = String(order["departmentName"] ?? "Unassigned");
      grouped.set(name, [...(grouped.get(name) ?? []), order]);
    }
    return Array.from(grouped, ([name, rows]) => {
      const completed = rows.filter((row) =>
        ["COMPLETED", "CONFIRMED"].includes(String(row["status"]).toUpperCase()),
      ).length;
      return {
        name,
        active: rows.length - completed,
        completed,
        pending: rows.filter((row) =>
          ["READY", "BLOCKED"].includes(String(row["status"]).toUpperCase()),
        ).length,
        efficiency: rows.length ? Math.round((completed / rows.length) * 100) : 0,
      };
    });
  }, [workflows]);
  if (!departments.length) {
    return loading ? (
      <div className="table-wrap">
        <EmptyState
          compact
          icon={Wrench}
          tone="muted"
          title="Loading department workload…"
          description="Fetching active work orders across workshop bays."
        />
      </div>
    ) : (
      <div className="table-wrap">
        <EmptyState
          compact
          icon={Wrench}
          title="No department work orders yet"
          description="Work orders appear here once job cards and repair plans are created."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link to="/departments">
                View departments
                <ArrowUpRight />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }
  return (
    <div className="department-grid">
      {departments.map((dept) => (
        <div className="department-card" key={dept.name}>
          <div className="flex items-center gap-2">
            <Wrench size={14} className="text-primary" />
            <h3>{dept.name}</h3>
          </div>
          <div className="dept-count">
            {dept.active}
            <span className="text-xs font-medium text-muted-foreground ml-2">active jobs</span>
          </div>
          <p>
            {dept.completed} completed · {dept.pending} pending
          </p>
          <ProgressBar value={dept.efficiency} />
          <div className="flex justify-between mt-2 text-xs font-medium text-muted-foreground tabular-nums">
            <span>Completion rate</span>
            <span>{dept.efficiency}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Dashboard({ role }: { role: WorkspaceRole }) {
  const w = useWorkspace();
  const {
    vehicles,
    jobs,
    requisitions,
    inspections,
    activities,
    foreman,
    setRole,
    dispatches,
    invoices,
    handovers,
    loading,
    error,
    workflowOptions,
    api,
    refresh,
  } = w;
  useEffect(() => setRole(role), [role, setRole]);
  const [period, setPeriod] = useState("This week");
  const [detail, setDetail] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState(false);
  const [approvingDispatch, setApprovingDispatch] = useState<number | null>(null);
  const [vehicleSort, setVehicleSort] = useState<SortState>(null);
  const [authSort, setAuthSort] = useState<SortState>(null);
  const [dispatchSort, setDispatchSort] = useState<SortState>(null);
  const pending = requisitions.filter((r) => r.status === "Pending").length;
  const isForeman = role === "Foreman";
  const isDirector = role === "Director";
  const isManagement = role === "Management";
  const employees = (workflowOptions["employees"] ?? []) as Record<string, unknown>[];
  const employeeId = Number(import.meta.env["VITE_EMPLOYEE_ID"]);
  const employeeName = String(
    employees.find((employee) => Number(employee["id"]) === employeeId)?.["name"] ?? "",
  );
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (stageFilter) {
      return jobs.some(
        (job) =>
          job.vehicleId === vehicle.id &&
          !["COMPLETED", "CANCELLED"].includes(job.status.toUpperCase()),
      );
    }
    return true;
  });
  const shownVehicles = sortRecords(filteredVehicles, vehicleSort, (vehicle, key) => {
    switch (key) {
      case "vehicle":
        return `${vehicle.make} ${vehicle.plate}`;
      case "customer":
        return vehicle.customer;
      case "received":
        return vehicle.received;
      case "stage":
        return vehicle.stage;
      case "department":
        return vehicle.department;
      default:
        return "";
    }
  }).slice(0, 5);
  const pendingAuthRequisitions = sortRecords(
    requisitions.filter((r) => r.status === "Pending"),
    authSort,
    (r, key) => {
      switch (key) {
        case "id":
          return r.id;
        case "part":
          return r.part;
        case "quantity":
          return r.quantity;
        case "department":
          return r.department;
        case "status":
          return r.status;
        default:
          return "";
      }
    },
  );
  const activeJobs = jobs.filter(
    (job) => !["COMPLETED", "CANCELLED", "CLOSED"].includes(job.status.toUpperCase()),
  ).length;
  const pendingDispatches = sortRecords(
    dispatches.filter(
      (dispatch) => String(dispatch["status"]).toUpperCase() === "PENDING_APPROVAL",
    ),
    dispatchSort,
    (dispatch, key) => {
      const dispatchId = Number(dispatch["dispatchOrderId"] ?? dispatch["id"]);
      const jobId = Number(dispatch["jobId"]);
      const job = jobs.find((candidate) => candidate.backendJobId === jobId);
      const vehicle = job
        ? vehicles.find((candidate) => candidate.id === job.vehicleId)
        : undefined;
      switch (key) {
        case "dispatch":
          return String(dispatch["dispatchNumber"] ?? dispatchId);
        case "job":
          return vehicle
            ? `${vehicle.plate} ${vehicle.customer}`
            : String(dispatch["jobNumber"] ?? jobId);
        case "department":
          return String(dispatch["departmentName"] ?? "");
        case "status":
          return String(dispatch["status"] ?? "Pending");
        default:
          return "";
      }
    },
  );
  const awaitingRelease = invoices.filter(
    (invoice) =>
      Number(invoice["balanceDue"] ?? 0) <= 0 &&
      !handovers.some((handover) => Number(handover["jobId"]) === Number(invoice["jobId"])),
  ).length;
  const trend = useMemo(() => {
    const now = new Date();
    const parsed = (value: string) => {
      const numeric = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (numeric) return new Date(Number(numeric[3]), Number(numeric[2]) - 1, Number(numeric[1]));
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };
    const points = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now);
      if (period === "This week") date.setDate(now.getDate() - (5 - index));
      else date.setDate(now.getDate() - (5 - index) * 7);
      date.setHours(0, 0, 0, 0);
      const next = new Date(date);
      if (period !== "This week") next.setDate(next.getDate() + 7);
      else next.setDate(next.getDate() + 1);
      const count = vehicles.filter((vehicle) => {
        const received = parsed(vehicle.received);
        return received && received >= date && received < next;
      }).length;
      return {
        label:
          period === "This week"
            ? new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date)
            : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date),
        count,
      };
    });
    return points;
  }, [period, vehicles]);
  const stageCounts = workflowStages
    .map((name, stage) => ({
      name,
      value: vehicles.filter((vehicle) => vehicle.stage === stage).length,
    }))
    .filter((item) => item.value > 0);
  const recentHalfIntake = trend.slice(3).reduce((total, point) => total + point.count, 0);
  const priorHalfIntake = trend.slice(0, 3).reduce((total, point) => total + point.count, 0);
  const intakeDiff = recentHalfIntake - priorHalfIntake;
  const intakeDelta =
    vehicles.length > 0
      ? {
          text: `${intakeDiff > 0 ? `+${intakeDiff}` : intakeDiff} vs prior`,
          direction: (intakeDiff > 0 ? "up" : intakeDiff < 0 ? "down" : "flat") as
            "up" | "down" | "flat",
        }
      : undefined;
  const activePartsCount = requisitions.filter((request) =>
    ["Pending", "Approved", "Ordered"].includes(request.status),
  ).length;
  const pendingInspectionsCount = inspections.filter(
    (inspection) => inspection.result === "Pending",
  ).length;
  const passedInspectionsCount = inspections.filter(
    (inspection) => inspection.result === "Passed",
  ).length;
  const inRepairVehiclesCount = vehicles.filter((vehicle) => !vehicle.released).length;
  const heading = isForeman
    ? "Foreman Dashboard"
    : isDirector
      ? "Director Dashboard"
      : "Management Dashboard";
  const subtitle = isForeman
    ? `Intake & workshop control · ${foreman}`
    : isDirector
      ? "Business overview & parts authorization"
      : "Workshop operations & performance oversight";
  const metrics = isForeman
    ? [
        {
          label: "Vehicles received",
          value: vehicles.length,
          note: `${inRepairVehiclesCount} active in workshop`,
          icon: metricIcons.Car,
          delta: intakeDelta,
        },
        {
          label: "Active job cards",
          value: activeJobs,
          note: jobs.length
            ? `${jobs.length - activeJobs} of ${jobs.length} completed`
            : "Open job cards",
          icon: metricIcons.Wrench,
        },
        {
          label: "Awaiting parts",
          value: activePartsCount,
          note: `${pending} pending director approval`,
          icon: metricIcons.Package,
          tone: (pending > 0 ? "warning" : "default") as "warning" | "default",
        },
        {
          label: "Ready for inspection",
          value: pendingInspectionsCount,
          note: inspections.length
            ? `${passedInspectionsCount} of ${inspections.length} passed`
            : "Inspections in progress",
          icon: metricIcons.ClipboardCheck,
          tone: (passedInspectionsCount > 0 && pendingInspectionsCount === 0
            ? "success"
            : "default") as "success" | "default",
        },
      ]
    : [
        {
          label: "Total vehicles",
          value: vehicles.length,
          note: `${vehicles.filter((v) => v.released).length} released to customers`,
          icon: metricIcons.Car,
          delta: intakeDelta,
        },
        {
          label: "Currently in repair",
          value: activeJobs,
          note: jobs.length
            ? `${Math.round((activeJobs / jobs.length) * 100)}% of total jobs active`
            : "Open job cards",
          icon: metricIcons.Wrench,
        },
        {
          label: isDirector ? "Pending parts approvals" : "Awaiting parts",
          value: isDirector
            ? pending
            : requisitions.filter((request) => request.status === "Pending").length,
          note: isDirector
            ? "Your authorization required"
            : `${requisitions.length} total requisitions`,
          icon: metricIcons.Package,
          tone: (pending > 0 ? "warning" : "default") as "warning" | "default",
        },
        {
          label: isDirector ? "Completed vehicles" : "Awaiting release",
          value: isDirector ? handovers.length : awaitingRelease,
          note: isDirector ? "Recorded vehicle handovers" : "Paid invoices awaiting handover",
          icon: metricIcons.ClipboardCheck,
          tone: (isDirector && handovers.length > 0
            ? "success"
            : awaitingRelease > 0
              ? "warning"
              : "default") as "success" | "warning" | "default",
        },
      ];
  return (
    <>
      <PageHeading title={heading} subtitle={subtitle}>
        <Button variant="outline" asChild>
          <Link to="/departments">
            <Wrench />
            Department workload
          </Link>
        </Button>
        {isForeman && (
          <Button asChild>
            <Link to="/registration">
              <Plus />
              Register vehicle
            </Link>
          </Button>
        )}
      </PageHeading>
      {error && (
        <div className="attention-band">
          <div>
            <strong>Workshop records could not be loaded</strong>
            <p>{error}</p>
          </div>
          <Button variant="outline" onClick={() => void refresh()}>
            Retry
          </Button>
        </div>
      )}
      <Metrics items={metrics} />
      <div
        className={`attention-band ${
          (isDirector && pending > 0) || (isManagement && pendingDispatches.length > 0)
            ? "attention-band-warning"
            : ""
        }`.trim()}
      >
        {isDirector ? <ShieldCheck size={18} /> : <Clock size={18} />}
        <div>
          <strong>
            {isDirector
              ? `${pending} parts requests are awaiting your authorization`
              : "Keep the workshop moving"}
          </strong>
          <p>
            {isDirector
              ? "Review requested parts, quantities and reasons before authorizing procurement."
              : isManagement
                ? `${pendingDispatches.length} parts dispatches are waiting for management approval.`
                : "Review workshop records and pending requisitions."}
          </p>
        </div>
        {isManagement ? (
          <Button
            variant="link"
            size="sm"
            className="band-action"
            onClick={() =>
              document.getElementById("dispatch-approvals")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Approve dispatches <ArrowRight size={13} />
          </Button>
        ) : (
          <Button variant="link" size="sm" className="band-action" asChild>
            <Link to={isDirector ? "/approvals" : "/requisitions"}>
              {isDirector ? "Approve requests" : "View requisitions"}
              <ArrowRight size={13} />
            </Link>
          </Button>
        )}
      </div>
      <div className="overview-grid">
        <section className="overview-section">
          <SectionHeading
            title="Vehicle intake"
            subtitle={period === "This week" ? "Last 6 days" : "Last 6 weeks"}
          >
            <DateFilter value={period} onChange={setPeriod} />
          </SectionHeading>
          {loading && vehicles.length === 0 ? (
            <EmptyState
              compact
              icon={Car}
              tone="muted"
              title="Loading intake records…"
              description="Retrieving recent vehicle intake activity."
            />
          ) : vehicles.length === 0 ? (
            <EmptyState
              compact
              icon={Car}
              title="No vehicle intake records yet"
              description="Intake volume will plot automatically as vehicles are registered."
              action={
                isForeman ? (
                  <Button size="sm" asChild>
                    <Link to="/registration">
                      <Plus />
                      Register vehicle
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <LineChart
              values={trend.map((point) => point.count)}
              labels={trend.map((point) => point.label)}
            />
          )}
          <div className="flex justify-between items-center mt-2">
            <div className="chart-key">
              <span />
              Vehicles received
            </div>
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {trend.reduce((total, point) => total + point.count, 0)} in this period
            </span>
          </div>
        </section>
        <section className="overview-section">
          <SectionHeading title="Workshop at a glance" subtitle="Current vehicle distribution">
            <Button asChild variant="link" size="sm">
              <Link to="/workflow">
                View workflow
                <ArrowUpRight size={13} />
              </Link>
            </Button>
          </SectionHeading>
          {stageCounts.length ? (
            stageCounts.map((item) => {
              const share = vehicles.length ? Math.round((item.value / vehicles.length) * 100) : 0;
              return (
                <div className="stage-row" key={item.name}>
                  <span className="truncate">{item.name}</span>
                  <ProgressBar value={share} />
                  <strong>
                    {item.value}{" "}
                    <span className="text-muted-foreground font-normal">({share}%)</span>
                  </strong>
                </div>
              );
            })
          ) : (
            <EmptyState
              compact
              icon={GitBranch}
              tone="muted"
              title="No vehicle workflow records yet"
              description="Stage distribution across the 12 workshop steps updates as vehicles progress."
            />
          )}
        </section>
      </div>
      <section className="table-section">
        <SectionHeading title="Recent vehicles" subtitle="Latest intake and workshop activity">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStageFilter((v) => !v)}
              aria-pressed={stageFilter}
            >
              <SlidersHorizontal />
              {stageFilter ? "All vehicles" : "In repair"}
            </Button>
            <ExportButton filename="workshop-overview" rows={vehicles} />
            <ViewAllVehicles />
          </div>
        </SectionHeading>
        <DataTable
          headers={[
            { label: "Vehicle", sortKey: "vehicle" },
            { label: "Customer", sortKey: "customer" },
            { label: "Received", sortKey: "received" },
            { label: "Current stage", sortKey: "stage" },
            { label: "Department", sortKey: "department" },
            "",
          ]}
          loading={loading}
          sort={vehicleSort}
          onSort={(key) => setVehicleSort((current) => nextSortState(current, key))}
          empty={shownVehicles.length === 0}
          emptyState={
            stageFilter ? (
              <EmptyState
                icon={SlidersHorizontal}
                tone="muted"
                title="No vehicles currently in repair"
                description="No vehicles match the active in-repair filter right now."
                action={
                  <>
                    <Button variant="outline" size="sm" onClick={() => setStageFilter(false)}>
                      <RotateCcw />
                      Show all vehicles
                    </Button>
                    {isForeman && (
                      <Button size="sm" asChild>
                        <Link to="/registration">
                          <Plus />
                          Register vehicle
                        </Link>
                      </Button>
                    )}
                  </>
                }
              />
            ) : (
              <EmptyState
                icon={Car}
                title="No vehicles registered yet"
                description="Register an incoming vehicle to track its progress from intake through inspection and handover."
                action={
                  isForeman ? (
                    <Button size="sm" asChild>
                      <Link to="/registration">
                        <Plus />
                        Register vehicle
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/vehicles">
                        View vehicle records
                        <ArrowUpRight />
                      </Link>
                    </Button>
                  )
                }
              />
            )
          }
        >
          {shownVehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td>
                <VehicleCell vehicle={vehicle} />
              </td>
              <td>{vehicle.customer}</td>
              <td className="text-muted-foreground">{vehicle.received.replace(" 2026", "")}</td>
              <td>
                <Status>
                  {
                    [
                      "Intake",
                      "Quotation",
                      "Awaiting approval",
                      "Inventory card",
                      "Job card",
                      "Parts requisition",
                      "Awaiting parts",
                      "Procurement",
                      "Parts dispatch",
                      "In repair",
                      "Inspection",
                      "Awaiting release",
                    ][vehicle.stage]
                  }
                </Status>
              </td>
              <td>{vehicle.department}</td>
              <td>
                <Button
                  variant="ghost"
                  size="icon"
                  title={`View ${vehicle.plate}`}
                  aria-label={`View ${vehicle.plate}`}
                  onClick={() => setDetail(vehicle.id)}
                >
                  <ArrowUpRight />
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
        <TableFooter count={shownVehicles.length} label="recent vehicles" />
      </section>
      {isDirector && (
        <section className="table-section">
          <SectionHeading
            title="Parts authorization"
            subtitle="Requests requiring a director decision"
          >
            <Button asChild variant="link" size="sm">
              <Link to="/approvals">
                Review all requests
                <ArrowRight size={13} />
              </Link>
            </Button>
          </SectionHeading>
          <DataTable
            headers={[
              { label: "Request", sortKey: "id" },
              { label: "Part", sortKey: "part" },
              { label: "Quantity", sortKey: "quantity", align: "right" },
              { label: "Department", sortKey: "department" },
              { label: "Status", sortKey: "status" },
              "",
            ]}
            loading={loading}
            sort={authSort}
            onSort={(key) => setAuthSort((current) => nextSortState(current, key))}
            empty={pending === 0}
            emptyState={
              <EmptyState
                icon={ShieldCheck}
                title="No parts awaiting authorization"
                description="All submitted parts requisitions have been reviewed. New requests from foremen will appear here."
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/approvals">
                      View all requisitions
                      <ArrowRight />
                    </Link>
                  </Button>
                }
              />
            }
          >
            {pendingAuthRequisitions.map((r) => (
              <tr key={r.id}>
                <td className="cell-title">{r.id}</td>
                <td>{r.part}</td>
                <td className="text-right tabular-nums">{r.quantity}</td>
                <td>{r.department}</td>
                <td>
                  <Status>{r.status}</Status>
                </td>
                <td>
                  <Button asChild size="sm" className="approval-primary-btn">
                    <Link to="/approvals">
                      Approve
                      <ArrowRight size={12} />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </DataTable>
        </section>
      )}
      {isManagement && (
        <section className="table-section" id="dispatch-approvals">
          <SectionHeading
            title="Parts dispatch approvals"
            subtitle="Approve dispatch orders before issue"
          >
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Refresh
            </Button>
          </SectionHeading>
          <DataTable
            headers={[
              { label: "Dispatch", sortKey: "dispatch" },
              { label: "Job", sortKey: "job" },
              { label: "Department", sortKey: "department" },
              { label: "Status", sortKey: "status" },
              "Action",
            ]}
            loading={loading}
            sort={dispatchSort}
            onSort={(key) => setDispatchSort((current) => nextSortState(current, key))}
            empty={!pendingDispatches.length}
            emptyState={
              <EmptyState
                icon={Truck}
                title="No pending dispatch approvals"
                description="There are no workshop parts dispatches waiting for management sign-off."
                action={
                  <Button variant="outline" size="sm" onClick={() => void refresh()}>
                    <RotateCcw />
                    Refresh queue
                  </Button>
                }
              />
            }
          >
            {pendingDispatches.map((dispatch) => {
              const dispatchId = Number(dispatch["dispatchOrderId"] ?? dispatch["id"]);
              const jobId = Number(dispatch["jobId"]);
              const job = jobs.find((candidate) => candidate.backendJobId === jobId);
              const vehicle = job
                ? vehicles.find((candidate) => candidate.id === job.vehicleId)
                : undefined;
              return (
                <tr key={dispatchId}>
                  <td className="cell-title">{String(dispatch["dispatchNumber"] ?? dispatchId)}</td>
                  <td>
                    {vehicle
                      ? `${vehicle.plate} · ${vehicle.customer}`
                      : String(dispatch["jobNumber"] ?? jobId)}
                  </td>
                  <td>{String(dispatch["departmentName"] ?? "—")}</td>
                  <td>
                    <Status>{String(dispatch["status"] ?? "Pending")}</Status>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      disabled={approvingDispatch === dispatchId}
                      onClick={async () => {
                        if (!Number.isSafeInteger(employeeId) || employeeId <= 0 || !employeeName) {
                          toast.error(
                            "Set VITE_EMPLOYEE_ID to an active workshop employee before approving dispatches.",
                          );
                          return;
                        }
                        setApprovingDispatch(dispatchId);
                        try {
                          await api.dispatchAction(dispatchId, "approve", {
                            approvedByEmployeeId: employeeId,
                            signerName: employeeName,
                            remarks: "Approved from Management dashboard",
                          });
                          await refresh();
                          toast.success("Dispatch approved.");
                        } catch (approvalError) {
                          toast.error(
                            approvalError instanceof Error
                              ? approvalError.message
                              : "Could not approve dispatch.",
                          );
                        } finally {
                          setApprovingDispatch(null);
                        }
                      }}
                    >
                      Approve
                    </Button>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </section>
      )}
      <section>
        <SectionHeading
          title="Department workload"
          subtitle="Work coordinated by foremen, across the workshop"
        >
          <Button asChild variant="link" size="sm">
            <Link to="/departments">
              View performance
              <ArrowUpRight size={13} />
            </Link>
          </Button>
        </SectionHeading>
        <DepartmentCards />
      </section>
      {!isForeman && (
        <div className="overview-grid mt-7">
          <section>
            <SectionHeading title="Recent activity" />
            {activities.length > 0 ? (
              activities.slice(0, 3).map((a, i) => (
                <div className="activity-row" key={i}>
                  <ClipboardList />
                  <div className="flex-1">
                    <p>{a.text}</p>
                    <small>{a.detail}</small>
                  </div>
                  <small>{a.time}</small>
                </div>
              ))
            ) : (
              <EmptyState
                compact
                icon={ClipboardList}
                tone="muted"
                title="No recent workshop activity"
                description="Vehicle registrations, quotations, job cards, and approvals will appear here."
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/vehicles">
                      View vehicle records
                      <ArrowUpRight />
                    </Link>
                  </Button>
                }
              />
            )}
          </section>
          <section>
            <SectionHeading title="Operational priorities" />
            {[
              {
                icon: Clock,
                count: pending,
                label: "pending requisitions",
                detail: "Awaiting director decision",
              },
              {
                icon: Package,
                count: pendingDispatches.length,
                label: "dispatches pending approval",
                detail: "Awaiting management decision",
              },
              {
                icon: FileText,
                count: awaitingRelease,
                label: "vehicles awaiting handover",
                detail: "Paid invoices without a recorded handover",
              },
            ]
              .filter((priority) => priority.count > 0)
              .map((priority) => {
                const Icon = priority.icon;
                return (
                  <div className="activity-row" key={priority.label}>
                    <Icon />
                    <div>
                      <p>
                        {priority.count} {priority.label}
                      </p>
                      <small>{priority.detail}</small>
                    </div>
                  </div>
                );
              })}
            {!pending && !pendingDispatches.length && !awaitingRelease && (
              <EmptyState
                compact
                icon={CheckCircle2}
                tone="muted"
                title="No outstanding priorities"
                description="No pending requisitions, dispatch approvals, or unpaid handovers require attention."
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/alerts">
                      View operational alerts
                      <ArrowUpRight />
                    </Link>
                  </Button>
                }
              />
            )}
          </section>
        </div>
      )}
      <VehicleDetail id={detail} onClose={() => setDetail(null)} />
    </>
  );
}
