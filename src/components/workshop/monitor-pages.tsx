import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Plus,
  Check,
  ShieldCheck,
  Clock,
  Package,
  FileText,
  Download,
  Wrench,
  ArrowRight,
  Save,
  Truck,
  Car,
  Search,
  RotateCcw,
  GitBranch,
  ClipboardList,
} from "./fa-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  TableFooter,
  ToolbarSearch,
  ProgressBar,
  Workflow,
  ExportButton,
  exportCsv,
} from "./shared";
import { DepartmentCards } from "./dashboard";
import { VehicleDetail } from "./vehicle-detail";
import { RequestDetail } from "./record-pages";
import {
  workflowStages,
  departments,
  buildDepartmentOverview,
  canAuthorizeRelease,
  filterVehicles,
  money,
  nextSortState,
  sortRecords,
  type SortState,
  type Requisition,
} from "@/lib/workshop";

export function VehiclesPage() {
  const w = useWorkspace();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All");
  const [sort, setSort] = useState<SortState>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [release, setRelease] = useState<string | null>(null);
  const filtered = sortRecords(
    filterVehicles(w.vehicles, { query, globalSearch: w.search, stage }),
    sort,
    (v, key) => {
      switch (key) {
        case "vehicle":
          return `${v.make} ${v.plate}`;
        case "vin":
          return v.vin ?? "";
        case "customer":
          return v.customer;
        case "received":
          return v.received;
        case "stage":
          return v.released ? 999 : v.stage;
        case "foreman":
          return v.foreman;
        default:
          return "";
      }
    },
  );
  return (
    <>
      <PageHeading
        title="Vehicle Records"
        subtitle="Complete vehicle history, customer details and workshop records"
      >
        <ExportButton filename="vehicle-records" rows={w.vehicles} />
        {w.role === "Foreman" && (
          <Button asChild>
            <Link to="/registration">
              <Plus />
              Register vehicle
            </Link>
          </Button>
        )}
      </PageHeading>
      <div className="toolbar">
        <ToolbarSearch
          ariaLabel="Search vehicles by VIN, license plate, or owner name"
          placeholder="Search by VIN, license plate, or owner name..."
          value={query}
          onChange={setQuery}
        />
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger
            className="w-[220px] h-[38px] rounded-[6px] border-[#d1d5db] bg-background text-sm font-normal shadow-none"
            aria-label="Filter workflow stage"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All workflow stages</SelectItem>
            {workflowStages.map((s, i) => (
              <SelectItem key={s} value={String(i)}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        headers={[
          { label: "Vehicle", sortKey: "vehicle" },
          { label: "VIN", sortKey: "vin" },
          { label: "Customer", sortKey: "customer" },
          { label: "Received", sortKey: "received" },
          { label: "Current stage", sortKey: "stage" },
          { label: "Foreman", sortKey: "foreman" },
          "Actions",
        ]}
        loading={w.loading}
        sort={sort}
        onSort={(key) => setSort((current) => nextSortState(current, key))}
        empty={filtered.length === 0}
        emptyState={
          query.trim() || w.search.trim() || stage !== "All" ? (
            <EmptyState
              icon={Search}
              tone="muted"
              title="No matching vehicles"
              description="No vehicle records matched your search query or selected workflow stage."
              action={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setStage("All");
                      w.setSearch("");
                    }}
                  >
                    <RotateCcw />
                    Clear filters
                  </Button>
                  {w.role === "Foreman" && (
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
              title="No vehicles in workshop"
              description="Register an incoming customer vehicle to track repairs, quotations, parts, and final handover."
              action={
                w.role === "Foreman" ? (
                  <Button size="sm" asChild>
                    <Link to="/registration">
                      <Plus />
                      Register vehicle
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => void w.refresh()}>
                    <RotateCcw />
                    Refresh records
                  </Button>
                )
              }
            />
          )
        }
      >
        {filtered.map((v) => (
          <tr key={v.id}>
            <td>
              <VehicleCell vehicle={v} />
            </td>
            <td>
              <span className="font-mono text-xs">{v.vin || "—"}</span>
            </td>
            <td>{v.customer}</td>
            <td>{v.received}</td>
            <td>
              <Status>{v.released ? "Released" : (workflowStages[v.stage] ?? "Intake")}</Status>
            </td>
            <td>{v.foreman}</td>
            <td>
              <div className="flex gap-2">
                {v.stage === 11 && !v.released && canAuthorizeRelease(w.role) && (
                  <Button variant="outline" size="sm" onClick={() => setRelease(v.id)}>
                    Authorize release
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  title={`View ${v.plate}`}
                  aria-label={`View ${v.plate}`}
                  onClick={() => setDetail(v.id)}
                >
                  <ArrowUpRight />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <TableFooter count={filtered.length} label="vehicles" />
      <VehicleDetail id={detail} onClose={() => setDetail(null)} />
      <Dialog
        open={!!release}
        onOpenChange={(o) => {
          if (!o) setRelease(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice & vehicle release</DialogTitle>
            <DialogDescription>
              Management final authorization · {release && w.vehicleFor(release)?.plate}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!release || !canAuthorizeRelease(w.role)) return;
              const data = new FormData(e.currentTarget);
              w.setVehicles((prev) =>
                prev.map((v) => (v.id === release ? { ...v, released: true } : v)),
              );
              w.addActivity(
                "Vehicle release authorized",
                `${release} · Invoice ${String(data.get("invoice"))}`,
              );
              toast.success("Final release authorized and invoice reference recorded.");
              setRelease(null);
            }}
          >
            <div className="space-y-4 pt-2">
              <div className="registration-row-compact">
                <label htmlFor="release-invoice" className="registration-label">
                  Invoice Reference <span className="registration-required">*</span>
                </label>
                <Input
                  id="release-invoice"
                  required
                  name="invoice"
                  placeholder="e.g. INV-2026-1042"
                  className="registration-input"
                />
              </div>
              <div className="registration-row-compact">
                <span className="registration-label">
                  Confirmation <span className="registration-required">*</span>
                </span>
                <label className="flex items-center gap-2.5 text-xs cursor-pointer">
                  <input type="checkbox" required className="rounded border-[#d1d5db] w-4 h-4" />
                  <span>Inspection passed and final release approved</span>
                </label>
              </div>
            </div>
            <div className="registration-actions-modal">
              <Button type="submit" className="registration-submit-btn">
                <Check />
                Submit
              </Button>
              <Button
                type="button"
                variant="outline"
                className="registration-reset-btn"
                onClick={() => setRelease(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ApprovalPage() {
  const w = useWorkspace();
  const [filter, setFilter] = useState("Pending");
  const [sort, setSort] = useState<SortState>(null);
  const [request, setRequest] = useState<Requisition | null>(null);
  const pending = w.requisitions.filter((r) => r.status === "Pending");
  const shown = sortRecords(
    w.requisitions.filter(
      (r) =>
        (filter === "All" || r.status === filter) &&
        `${r.id} ${r.part} ${w.vehicleFor(r.vehicleId)?.plate}`
          .toLowerCase()
          .includes(w.search.toLowerCase()),
    ),
    sort,
    (r, key) => {
      const vehicle = w.vehicleFor(r.vehicleId);
      switch (key) {
        case "id":
          return r.id;
        case "vehicle":
          return `${vehicle?.make ?? ""} ${vehicle?.plate ?? ""}`;
        case "part":
          return r.part;
        case "quantity":
          return r.quantity;
        case "status":
          return r.status;
        default:
          return "";
      }
    },
  );
  return (
    <>
      <PageHeading
        title="Parts Approvals"
        subtitle="Director authorization · Review parts before procurement"
      >
        <ExportButton filename="parts-approvals" rows={w.requisitions} />
      </PageHeading>
      <div
        className={`attention-band ${pending.length > 0 ? "attention-band-warning" : ""}`.trim()}
      >
        <ShieldCheck size={22} />
        <div>
          <strong>{pending.length} parts requests require your authorization</strong>
          <p>Review each request, then approve or reject it before procurement begins.</p>
        </div>
      </div>
      <Metrics
        items={[
          {
            label: "Pending approvals",
            value: pending.length,
            note: "Awaiting your decision",
            icon: metricIcons.Clock,
            tone: pending.length > 0 ? "warning" : "default",
          },
          {
            label: "Approved requests",
            value: w.requisitions.filter((r) => r.status === "Approved").length,
            note: "Ready for procurement",
            icon: metricIcons.ClipboardCheck,
            tone: "success",
          },
          {
            label: "Rejected requests",
            value: w.requisitions.filter((r) => r.status === "Rejected").length,
            note: "Returned to foremen",
            icon: metricIcons.FileText,
          },
          {
            label: "Ordered & dispatched",
            value: w.requisitions.filter((r) => ["Ordered", "Dispatched"].includes(r.status))
              .length,
            note: "Procurement in progress",
            icon: metricIcons.Package,
          },
        ]}
      />
      <div className="toolbar">
        <h2 className="text-base font-semibold">Parts authorization queue</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger
            className="w-[180px] h-[38px] rounded-[6px] border-[#d1d5db] bg-background text-sm font-normal shadow-none"
            aria-label="Approval queue status"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Pending", "Approved", "Rejected", "All"].map((s) => (
              <SelectItem value={s} key={s}>
                {s === "All" ? "All requests" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        headers={[
          { label: "Request", sortKey: "id" },
          { label: "Vehicle", sortKey: "vehicle" },
          { label: "Part / item", sortKey: "part" },
          { label: "Qty", sortKey: "quantity", align: "right" },
          { label: "Status", sortKey: "status" },
          "Action",
        ]}
        loading={w.loading}
        sort={sort}
        onSort={(key) => setSort((current) => nextSortState(current, key))}
        empty={shown.length === 0}
        emptyState={
          filter !== "All" || Boolean(w.search.trim()) ? (
            <EmptyState
              icon={ShieldCheck}
              tone="muted"
              title={
                filter === "Pending" && !w.search.trim()
                  ? "No pending parts approvals"
                  : "No matching parts requests"
              }
              description={
                filter === "Pending" && !w.search.trim()
                  ? "There are no requisitions awaiting director authorization right now."
                  : "No parts requisitions match the active status filter or search query."
              }
              action={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilter("All");
                      w.setSearch("");
                    }}
                  >
                    <RotateCcw />
                    Show all requests
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => void w.refresh()}>
                    Refresh queue
                  </Button>
                </>
              }
            />
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="No parts requisitions submitted"
              description="Parts requests submitted by foremen for director authorization will appear in this queue."
              action={
                <Button variant="outline" size="sm" onClick={() => void w.refresh()}>
                  <RotateCcw />
                  Refresh queue
                </Button>
              }
            />
          )
        }
      >
        {shown.map((r) => (
          <tr key={r.id}>
            <td className="cell-title">{r.id}</td>
            <td>
              <VehicleCell vehicle={w.vehicleFor(r.vehicleId)} />
            </td>
            <td>{r.part}</td>
            <td className="text-right tabular-nums">{r.quantity}</td>
            <td>
              <Status>{r.status}</Status>
            </td>
            <td>
              <Button
                size="sm"
                variant={r.status === "Pending" ? "default" : "outline"}
                onClick={() => setRequest(r)}
              >
                {r.status === "Pending" ? "Review request" : "View details"}
                <ArrowRight size={13} />
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>
      <TableFooter count={shown.length} label="requests" />
      <RequestDetail request={request} allowDecision onClose={() => setRequest(null)} />
    </>
  );
}

export function WorkflowPage() {
  const w = useWorkspace();
  const [vehicleId, setVehicleId] = useState(w.vehicles[0]?.id ?? "");
  const [sort, setSort] = useState<SortState>(null);
  const selectedVehicleId = w.vehicles.some((item) => item.id === vehicleId)
    ? vehicleId
    : (w.vehicles[0]?.id ?? "");
  const v = w.vehicleFor(selectedVehicleId);
  const sortedVehicles = sortRecords(w.vehicles, sort, (vehicle, key) => {
    switch (key) {
      case "vehicle":
        return `${vehicle.make} ${vehicle.plate}`;
      case "stage":
        return vehicle.released ? 999 : vehicle.stage;
      case "department":
        return vehicle.department;
      case "progress":
        return vehicle.progress;
      case "due":
        return vehicle.due;
      default:
        return "";
    }
  });
  return (
    <>
      <PageHeading
        title="Workflow Tracking"
        subtitle="From vehicle intake to invoice and final release"
      >
        <ExportButton
          filename="workflow-tracking"
          rows={w.vehicles.map((v) => ({
            vehicle: v.plate,
            customer: v.customer,
            stage: workflowStages[v.stage],
            department: v.department,
            foreman: v.foreman,
          }))}
        />
      </PageHeading>
      <div className="toolbar">
        <div>
          <h2 className="text-base font-semibold">Vehicle workflow</h2>
          <p className="text-xs font-medium text-muted-foreground mt-1">
            {v ? `${v.customer || "Customer"} · ${v.foreman}` : "No vehicle selected"}
          </p>
        </div>
        <Select value={selectedVehicleId} onValueChange={setVehicleId}>
          <SelectTrigger
            className="w-[270px] h-[38px] rounded-[6px] border-[#d1d5db] bg-background text-sm font-normal shadow-none"
            aria-label="Track vehicle"
          >
            <SelectValue placeholder="Select a vehicle" />
          </SelectTrigger>
          <SelectContent>
            {w.vehicles.length === 0 ? (
              <SelectItem value="__empty" disabled>
                No registered vehicles
              </SelectItem>
            ) : (
              w.vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} · {vehicle.plate}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      {v && (
        <>
          <div className="attention-band">
            <Truck size={18} />
            <div>
              <strong>
                {v.make} · {v.plate}
              </strong>
              <p>
                Current stage: {v.released ? "Released" : workflowStages[v.stage]} · Expected
                completion: {v.due}
              </p>
            </div>
            <Status>{`${v.progress}% complete`}</Status>
          </div>
          <Workflow stage={v.stage} />
        </>
      )}
      <section className="table-section mt-8">
        <SectionHeading
          title="All vehicles"
          subtitle="Live position within the official 12-stage workshop process"
        />
        <DataTable
          headers={[
            { label: "Vehicle", sortKey: "vehicle" },
            { label: "Current stage", sortKey: "stage" },
            { label: "Department", sortKey: "department" },
            { label: "Progress", sortKey: "progress" },
            { label: "Expected completion", sortKey: "due" },
          ]}
          loading={w.loading}
          sort={sort}
          onSort={(key) => setSort((current) => nextSortState(current, key))}
          empty={sortedVehicles.length === 0}
          emptyState={
            <EmptyState
              icon={GitBranch}
              title="No vehicles in workflow"
              description="Vehicles appear across the 12-stage workshop process as soon as intake registration begins."
              action={
                w.role === "Foreman" ? (
                  <Button size="sm" asChild>
                    <Link to="/registration">
                      <Plus />
                      Register vehicle
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => void w.refresh()}>
                    <RotateCcw />
                    Refresh workflow
                  </Button>
                )
              }
            />
          }
        >
          {sortedVehicles.map((v) => (
            <tr key={v.id}>
              <td>
                <VehicleCell vehicle={v} />
              </td>
              <td>
                <Status>{v.released ? "Released" : (workflowStages[v.stage] ?? "Intake")}</Status>
              </td>
              <td>{v.department}</td>
              <td>
                <div className="w-[100px]">
                  <ProgressBar value={v.progress} />
                  <div className="text-xs font-medium tabular-nums mt-2 text-muted-foreground">
                    {v.progress}%
                  </div>
                </div>
              </td>
              <td>{v.due}</td>
            </tr>
          ))}
        </DataTable>
      </section>
    </>
  );
}

export function DepartmentsPage() {
  const w = useWorkspace();
  const [selected, setSelected] = useState("All");
  const [detail, setDetail] = useState<string | null>(null);
  const [deptSort, setDeptSort] = useState<SortState>(null);
  const [jobSort, setJobSort] = useState<SortState>(null);
  const departmentOverview = buildDepartmentOverview(w.jobs, w.workflows);
  const filterDepartments = Array.from(
    new Set<string>([...departments, ...departmentOverview.map((d) => d.name)]),
  );
  const sortedDepartments = sortRecords(departmentOverview, deptSort, (d, key) => {
    switch (key) {
      case "name":
        return d.name;
      case "assigned":
        return d.assigned;
      case "active":
        return d.active;
      case "completed":
        return d.completed;
      case "pending":
        return d.pending;
      case "delays":
        return d.delays;
      case "efficiency":
        return d.efficiency;
      default:
        return "";
    }
  });
  const filteredJobs = sortRecords(
    w.jobs.filter((j) => selected === "All" || j.department === selected),
    jobSort,
    (j, key) => {
      const vehicle = w.vehicleFor(j.vehicleId);
      switch (key) {
        case "id":
          return j.id;
        case "vehicle":
          return `${vehicle?.make ?? ""} ${vehicle?.plate ?? ""}`;
        case "department":
          return j.department;
        case "work":
          return j.work;
        case "status":
          return j.status;
        default:
          return "";
      }
    },
  );
  return (
    <>
      <PageHeading
        title="Department Performance"
        subtitle="Mechanical, panel beating, fitting, painting and sanding"
      >
        <ExportButton filename="department-performance" rows={departmentOverview} />
      </PageHeading>
      <DepartmentCards />
      <section className="table-section mt-8">
        <SectionHeading
          title="Department overview"
          subtitle="Work coordinated and recorded by the foremen"
        />
        <DataTable
          headers={[
            { label: "Department", sortKey: "name" },
            { label: "Assigned vehicles", sortKey: "assigned", align: "right" },
            { label: "In progress", sortKey: "active", align: "right" },
            { label: "Completed jobs", sortKey: "completed", align: "right" },
            { label: "Pending work", sortKey: "pending", align: "right" },
            { label: "Delays", sortKey: "delays", align: "right" },
            { label: "Completion rate", sortKey: "efficiency" },
          ]}
          loading={w.loading}
          sort={deptSort}
          onSort={(key) => setDeptSort((current) => nextSortState(current, key))}
          empty={sortedDepartments.length === 0}
          emptyState={
            <EmptyState
              icon={Wrench}
              title="No department metrics yet"
              description="Department throughput and delay metrics appear as repair tasks are tracked."
              action={
                <Button variant="outline" size="sm" onClick={() => void w.refresh()}>
                  <RotateCcw />
                  Refresh metrics
                </Button>
              }
            />
          }
        >
          {sortedDepartments.map((d) => (
            <tr key={d.name}>
              <td className="cell-title">{d.name}</td>
              <td className="text-right tabular-nums">{d.assigned}</td>
              <td className="text-right tabular-nums">{d.active}</td>
              <td className="text-right tabular-nums">{d.completed}</td>
              <td className="text-right tabular-nums">{d.pending}</td>
              <td className="text-right tabular-nums">{d.delays}</td>
              <td>
                <div className="flex items-center gap-3">
                  <div className="w-[80px]">
                    <ProgressBar value={d.efficiency} />
                  </div>
                  {d.efficiency}%
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>
      <section className="table-section">
        <SectionHeading title="Department assignments">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger
              className="w-[180px] h-[38px] rounded-[6px] border-[#d1d5db] bg-background text-sm font-normal shadow-none"
              aria-label="Select department"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All departments</SelectItem>
              {filterDepartments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SectionHeading>
        <DataTable
          headers={[
            { label: "Job card", sortKey: "id" },
            { label: "Vehicle", sortKey: "vehicle" },
            { label: "Department", sortKey: "department" },
            { label: "Work instructions", sortKey: "work" },
            { label: "Status", sortKey: "status" },
            "Actions",
          ]}
          loading={w.loading}
          sort={jobSort}
          onSort={(key) => setJobSort((current) => nextSortState(current, key))}
          empty={filteredJobs.length === 0}
          emptyState={
            selected !== "All" ? (
              <EmptyState
                icon={Wrench}
                tone="muted"
                title={`No job cards for ${selected}`}
                description="There are no active or completed job cards assigned to this department."
                action={
                  <Button variant="outline" size="sm" onClick={() => setSelected("All")}>
                    <RotateCcw />
                    Show all departments
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No department assignments yet"
                description="Job cards assigned to mechanical, panel beating, fitting, painting, and sanding appear here."
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/job-cards">
                      Go to job cards
                      <ArrowRight />
                    </Link>
                  </Button>
                }
              />
            )
          }
        >
          {filteredJobs.map((j) => (
            <tr key={j.id}>
              <td className="cell-title">{j.id}</td>
              <td>
                <VehicleCell vehicle={w.vehicleFor(j.vehicleId)} />
              </td>
              <td>{j.department}</td>
              <td className="whitespace-normal max-w-[260px]">{j.work}</td>
              <td>
                <Status>{j.status}</Status>
              </td>
              <td>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`View ${j.id}`}
                  title="View vehicle"
                  onClick={() => setDetail(j.vehicleId)}
                >
                  <ArrowUpRight />
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>
      <VehicleDetail id={detail} onClose={() => setDetail(null)} />
    </>
  );
}

export function WorkshopPage() {
  const w = useWorkspace();
  const [employeeId, setEmployeeId] = useState(String(import.meta.env["VITE_EMPLOYEE_ID"] ?? ""));
  const [sort, setSort] = useState<SortState>(null);
  const employees = (w.workflowOptions["employees"] ?? []) as Record<string, unknown>[];
  const workOrders = sortRecords(
    w.workflows.flatMap((plan) =>
      (Array.isArray(plan["workOrders"])
        ? (plan["workOrders"] as Record<string, unknown>[])
        : []
      ).map(
        (order) =>
          ({
            ...order,
            planId: Number(plan["repairPlanId"]),
            planStatus: String(plan["repairPlanStatus"]),
            jobId: Number(plan["jobId"]),
          }) as Record<string, unknown>,
      ),
    ),
    sort,
    (order, key) => {
      const job = w.jobs.find((item) => item.backendJobId === order["jobId"]);
      const vehicle = job && w.vehicleFor(job.vehicleId);
      switch (key) {
        case "workOrder":
          return String(order["workOrderNumber"] ?? order["taskTitle"] ?? "");
        case "vehicle":
          return `${vehicle?.make ?? ""} ${vehicle?.plate ?? ""}`;
        case "department":
          return String(order["departmentName"] ?? "");
        case "status":
          return String(order["status"] ?? "");
        default:
          return "";
      }
    },
  );
  const run = (action: () => Promise<unknown>, success: string) =>
    void action()
      .then(async () => {
        await w.refresh();
        toast.success(success);
      })
      .catch((error: Error) => toast.error(error.message));
  return (
    <>
      <PageHeading
        title="Workshop Progress"
        subtitle="Repair plan, work orders and department visits from the backend"
      >
        <ExportButton filename="workshop-progress" rows={w.jobs} />
      </PageHeading>
      <label className="field max-w-sm mb-5">
        <span>Employee performing workshop actions</span>
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger>
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={String(employee["id"])} value={String(employee["id"])}>
                {String(employee["name"])} · {String(employee["title"])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <section className="table-section mt-8">
        <SectionHeading title="Repair plan work orders" />
        <DataTable
          headers={[
            { label: "Work order", sortKey: "workOrder" },
            { label: "Vehicle", sortKey: "vehicle" },
            { label: "Department", sortKey: "department" },
            { label: "Status", sortKey: "status" },
            "Assignments / visits / evidence",
          ]}
          loading={w.loading}
          sort={sort}
          onSort={(key) => setSort((current) => nextSortState(current, key))}
          empty={workOrders.length === 0}
          emptyState={
            <EmptyState
              icon={Wrench}
              title="No repair plan work orders"
              description="Work orders appear here once repair plans are initialized from open job cards."
              action={
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/job-cards">
                      View job cards
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => void w.refresh()}>
                    <RotateCcw />
                    Refresh
                  </Button>
                </>
              }
            />
          }
        >
          {workOrders.map((order) => {
            const job = w.jobs.find((item) => item.backendJobId === order["jobId"]);
            const vehicle = job && w.vehicleFor(job.vehicleId);
            const assignments = Array.isArray(order["assignments"])
              ? (order["assignments"] as Record<string, unknown>[])
              : [];
            const visits = Array.isArray(order["departmentVisits"])
              ? (order["departmentVisits"] as Record<string, unknown>[])
              : [];
            const activeVisit = visits.find((visit) => visit["status"] === "OPEN");
            const evidence = Array.isArray(order["evidence"])
              ? (order["evidence"] as Record<string, unknown>[])
              : [];
            const sessions = Array.isArray(order["sessions"])
              ? (order["sessions"] as Record<string, unknown>[])
              : [];
            const id = Number(order["workOrderId"]);
            const departmentId = Number(order["departmentId"]);
            return (
              <tr key={id}>
                <td className="cell-title">
                  <strong>{String(order["workOrderNumber"])}</strong>
                  <br />
                  {String(order["taskTitle"])}
                  <p className="text-xs text-muted-foreground mt-1">
                    {String(order["workInstructions"] ?? order["workDescription"] ?? "")}
                  </p>
                </td>
                <td>
                  <VehicleCell vehicle={vehicle} />
                </td>
                <td>{String(order["departmentName"])}</td>
                <td>
                  <Status>{String(order["status"])}</Status>
                </td>
                <td>
                  <p className="text-xs">
                    {assignments.map((a) => String(a["employeeName"])).join(", ") ||
                      "No assignment"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {visits.map((v) => `${v["departmentName"]} · ${v["status"]}`).join("; ") ||
                      "No department visit"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {evidence.length} evidence files · {sessions.length} work sessions
                  </p>
                  {String(order["planStatus"]) === "DRAFT" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        run(
                          () => w.api.acceptRepairPlan(Number(order["planId"]), Number(employeeId)),
                          "Repair plan accepted.",
                        )
                      }
                    >
                      Accept repair plan
                    </Button>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Select
                      value=""
                      onValueChange={(value) =>
                        run(
                          () =>
                            w.api.assignWorkOrder(
                              id,
                              Number(value),
                              "TECHNICIAN",
                              Number(employeeId),
                            ),
                          "Work order assigned.",
                        )
                      }
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue placeholder="Assign employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((e) => (
                          <SelectItem key={String(e["id"])} value={String(e["id"])}>
                            {String(e["name"])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!activeVisit &&
                      (String(order["status"]) === "READY" ||
                        String(order["status"]) === "ASSIGNED") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            run(
                              () =>
                                w.api.arriveAtDepartment(
                                  id,
                                  departmentId,
                                  "Vehicle arrived at department",
                                  Number(employeeId),
                                ),
                              "Department arrival recorded.",
                            )
                          }
                        >
                          Record arrival
                        </Button>
                      )}
                    {activeVisit &&
                      ["READY", "ASSIGNED", "PAUSED", "WAITING"].includes(
                        String(order["status"]),
                      ) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            run(
                              () =>
                                w.api.workOrderAction(
                                  id,
                                  String(order["status"]) === "PAUSED" ? "resume" : "start",
                                  "Workshop work started",
                                  Number(employeeId),
                                ),
                              "Work started.",
                            )
                          }
                        >
                          {String(order["status"]) === "PAUSED" ? "Resume" : "Start"}
                        </Button>
                      )}
                    {activeVisit && String(order["status"]) === "IN_PROGRESS" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            run(
                              () =>
                                w.api.workOrderAction(
                                  id,
                                  "pause",
                                  "Work paused",
                                  Number(employeeId),
                                ),
                              "Work paused.",
                            )
                          }
                        >
                          Pause
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            run(
                              () =>
                                w.api.workOrderAction(
                                  id,
                                  "waiting",
                                  "Waiting for parts or information",
                                  Number(employeeId),
                                ),
                              "Work marked waiting.",
                            )
                          }
                        >
                          Waiting
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const notes = window.prompt("Completion notes");
                            if (notes)
                              run(
                                () => w.api.submitWorkOrder(id, notes, Number(employeeId)),
                                "Submitted for confirmation.",
                              );
                          }}
                        >
                          Submit completion
                        </Button>
                      </>
                    )}
                    {activeVisit && String(order["status"]) === "AWAITING_CONFIRMATION" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          run(
                            () =>
                              w.api.confirmWorkOrder(
                                id,
                                "Work completion confirmed",
                                Number(employeeId),
                              ),
                            "Work order completed.",
                          )
                        }
                      >
                        Confirm completion
                      </Button>
                    )}
                    {activeVisit && String(order["status"]) === "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          run(
                            () =>
                              w.api.sendOffDepartment(
                                id,
                                departmentId,
                                Number(activeVisit["visitId"]),
                                "Department work completed",
                                Number(employeeId),
                              ),
                            "Department send-off recorded.",
                          )
                        }
                      >
                        Send off
                      </Button>
                    )}
                    {activeVisit && (
                      <label className="text-xs">
                        <span className="sr-only">Upload work photo evidence</span>
                        <Input
                          className="h-8 w-48"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file)
                              run(
                                () =>
                                  w.api.uploadWorkEvidence(
                                    id,
                                    file,
                                    "Work order evidence",
                                    Number(employeeId),
                                  ),
                                "Evidence uploaded.",
                              );
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {sessions.length > 0 && (
                    <ul className="mt-2 text-xs">
                      {sessions.map((session) => (
                        <li key={String(session["sessionId"])}>
                          {String(session["startedAt"])} · {String(session["sessionStatus"])} ·{" "}
                          {String(session["durationMinutes"])} min
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            );
          })}
        </DataTable>
      </section>
    </>
  );
}

export function ProcurementPage() {
  const w = useWorkspace();
  const [reqSort, setReqSort] = useState<SortState>(null);
  const [poSort, setPoSort] = useState<SortState>(null);
  const options = w.workflowOptions as {
    suppliers?: Array<{ supplierId: number; supplierName: string }>;
    stockLocations?: Array<{ stockLocationId: number; locationName: string }>;
  };
  const suppliers = options.suppliers ?? [];
  const locations = options.stockLocations ?? [];
  const requests = sortRecords(w.requisitions, reqSort, (r, key) => {
    const vehicle = w.vehicleFor(r.vehicleId);
    switch (key) {
      case "id":
        return r.id;
      case "part":
        return r.part;
      case "vehicle":
        return `${vehicle?.make ?? ""} ${vehicle?.plate ?? ""}`;
      case "quantity":
        return r.quantity;
      case "status":
        return r.status;
      default:
        return "";
    }
  });
  const orders = sortRecords(w.purchaseOrders, poSort, (order, key) => {
    const items = Array.isArray(order["items"])
      ? (order["items"] as Array<Record<string, unknown>>)
      : [];
    switch (key) {
      case "order":
        return String(order["purchaseOrderNumber"] ?? order["purchaseOrderId"] ?? "");
      case "supplier":
        return String(order["supplierName"] ?? "");
      case "status":
        return String(order["status"] ?? "");
      case "items":
        return items.length;
      default:
        return "";
    }
  });
  const reportError = (error: unknown) =>
    toast.error(error instanceof Error ? error.message : "The backend request failed.");
  return (
    <>
      <PageHeading
        title="Procurement & Parts Dispatch"
        subtitle="Purchasing and departmental dispatch after director authorization"
      >
        <ExportButton filename="procurement-dispatch" rows={requests} />
      </PageHeading>
      <Metrics
        items={[
          {
            label: "Ready to purchase",
            value: requests.filter((r) => r.status === "Approved").length,
            note: "Approved and ready for PO",
            icon: metricIcons.ClipboardCheck,
            tone: "success",
          },
          {
            label: "On order",
            value: orders.length,
            note: "Awaiting supplier delivery",
            icon: metricIcons.Package,
            tone: orders.length > 0 ? "warning" : "default",
          },
          {
            label: "Parts dispatched",
            value: w.dispatches.length,
            note: "Workshop dispatch orders",
            icon: metricIcons.Wrench,
          },
          {
            label: "Total requisitions",
            value: requests.length,
            note: "Matching current records",
            icon: metricIcons.FileText,
          },
        ]}
      />
      <DataTable
        headers={[
          { label: "Requisition", sortKey: "id" },
          { label: "Part / item", sortKey: "part" },
          { label: "Vehicle", sortKey: "vehicle" },
          { label: "Quantity", sortKey: "quantity", align: "right" },
          { label: "Status", sortKey: "status" },
          "Purchase order",
        ]}
        loading={w.loading}
        sort={reqSort}
        onSort={(key) => setReqSort((current) => nextSortState(current, key))}
        empty={requests.length === 0}
        emptyState={
          <EmptyState
            icon={Package}
            title="No parts requisitions to process"
            description="Approved parts requests ready for supplier purchase orders will appear here."
            action={
              <Button variant="outline" size="sm" asChild>
                <Link to="/requisitions">
                  View requisitions
                  <ArrowRight />
                </Link>
              </Button>
            }
          />
        }
      >
        {requests.map((r) => (
          <tr key={r.id}>
            <td className="cell-title">{r.id}</td>
            <td>{r.part}</td>
            <td>
              <VehicleCell vehicle={w.vehicleFor(r.vehicleId)} />
            </td>
            <td className="text-right tabular-nums">{r.quantity}</td>
            <td>
              <Status>{r.status}</Status>
            </td>
            <td>
              {r.status === "Approved" && r.backendId && suppliers.length > 0 && (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    try {
                      await w.api.createPurchaseOrder(
                        Number(r.backendId),
                        Number(form.get("supplier")),
                        (r.lines ?? []).map((line) => ({
                          requisitionItemId: line.id,
                          quantityOrdered: line.quantity,
                          unitPrice: 0,
                        })),
                        String(form.get("reference") ?? ""),
                      );
                      await w.refresh();
                      toast.success("Purchase order created.");
                    } catch (error) {
                      reportError(error);
                    }
                  }}
                >
                  <select name="supplier" required aria-label="Supplier" className="field-input">
                    <option value="">Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.supplierId} value={supplier.supplierId}>
                        {supplier.supplierName}
                      </option>
                    ))}
                  </select>
                  <Input
                    name="reference"
                    aria-label="Supplier reference"
                    placeholder="Supplier ref"
                    className="registration-input w-36"
                  />
                  <Button size="sm" className="registration-submit-btn">
                    Create PO
                  </Button>
                </form>
              )}
            </td>
          </tr>
        ))}
      </DataTable>
      <TableFooter count={requests.length} label="backend requisitions" />
      <SectionHeading title="Purchase orders" />
      <DataTable
        headers={[
          { label: "Order", sortKey: "order" },
          { label: "Supplier", sortKey: "supplier" },
          { label: "Status", sortKey: "status" },
          { label: "Items", sortKey: "items" },
          "Receive",
        ]}
        loading={w.loading}
        sort={poSort}
        onSort={(key) => setPoSort((current) => nextSortState(current, key))}
        empty={!orders.length}
        emptyState={
          <EmptyState
            icon={Truck}
            title="No purchase orders placed"
            description="Create a purchase order from an approved requisition above to track supplier deliveries and stock receipt."
            action={
              <Button variant="outline" size="sm" onClick={() => void w.refresh()}>
                <RotateCcw />
                Refresh orders
              </Button>
            }
          />
        }
      >
        {orders.map((order) => {
          const items = Array.isArray(order["items"])
            ? (order["items"] as Array<Record<string, unknown>>)
            : [];
          const id = Number(order["purchaseOrderId"]);
          return (
            <tr key={id}>
              <td className="cell-title">{String(order["purchaseOrderNumber"] ?? id)}</td>
              <td>{String(order["supplierName"] ?? "")}</td>
              <td>
                <Status>{String(order["status"] ?? "")}</Status>
              </td>
              <td>
                {items
                  .map(
                    (item) =>
                      `${String(item["partName"] ?? item["partCode"])} × ${String(item["quantityOrdered"] ?? "")}`,
                  )
                  .join(", ")}
              </td>
              <td>
                {locations.length > 0 && String(order["status"]).toUpperCase() !== "RECEIVED" && (
                  <form
                    className="flex gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      try {
                        await w.api.receivePurchaseOrder(
                          id,
                          Number(form.get("location")),
                          items.map((item) => ({
                            purchaseOrderItemId: Number(item["purchaseOrderItemId"]),
                            quantityDelivered:
                              Number(item["quantityOrdered"]) -
                              Number(item["quantityReceived"] ?? 0),
                            quantityAccepted:
                              Number(item["quantityOrdered"]) -
                              Number(item["quantityReceived"] ?? 0),
                          })),
                          String(form.get("deliveryRef") ?? ""),
                        );
                        await w.refresh();
                        toast.success("Purchase order receipt recorded.");
                      } catch (error) {
                        reportError(error);
                      }
                    }}
                  >
                    <select
                      name="location"
                      required
                      aria-label="Receiving stock location"
                      className="field-input"
                    >
                      <option value="">Location</option>
                      {locations.map((location) => (
                        <option key={location.stockLocationId} value={location.stockLocationId}>
                          {location.locationName}
                        </option>
                      ))}
                    </select>
                    <Input
                      name="deliveryRef"
                      aria-label="Delivery reference"
                      placeholder="Delivery ref"
                      className="registration-input w-36"
                    />
                    <Button size="sm" className="registration-submit-btn">
                      Receive
                    </Button>
                  </form>
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>
    </>
  );
}

export function ReportsPage() {
  const w = useWorkspace();
  const reports = [
    {
      name: "Workshop operations report",
      description: "Vehicle intake, current stage, departments and completion dates",
      data: w.vehicles,
      filename: "workshop-operations",
    },
    {
      name: "Parts requisitions & approvals",
      description: "Requested parts, quantities, values and authorization status",
      data: w.requisitions,
      filename: "parts-requisitions",
    },
    {
      name: "Department performance",
      description: "Active, completed and delayed work by department",
      data: buildDepartmentOverview(w.jobs, w.workflows),
      filename: "department-performance",
    },
    {
      name: "Customer quotations",
      description: "Quotation values and customer approval records",
      data: w.quotations,
      filename: "customer-quotations",
    },
    {
      name: "Vehicle inspection results",
      description: "Foreman inspections, final checks and completion notes",
      data: w.inspections,
      filename: "vehicle-inspections",
    },
  ];
  return (
    <>
      <PageHeading
        title="Operational Reports"
        subtitle="Workshop and business reporting · November 2026"
      />
      {reports.map((r) => (
        <div className="report-row" key={r.name}>
          <FileText size={23} />
          <div>
            <h2>{r.name}</h2>
            <p>{r.description}</p>
          </div>
          <Button
            variant="outline"
            className="report-action"
            onClick={() => exportCsv(r.filename, r.data)}
          >
            <Download />
            Download CSV
          </Button>
        </div>
      ))}
    </>
  );
}

export function AlertsPage() {
  const w = useWorkspace();
  return (
    <>
      <PageHeading
        title="Operational Alerts"
        subtitle="Outstanding approvals, vehicle delays and release priorities"
      />
      <section>
        <SectionHeading title="Requires attention" />
        <div
          className={`attention-band ${
            w.requisitions.filter((r) => r.status === "Pending").length > 0
              ? "attention-band-warning"
              : ""
          }`.trim()}
        >
          <ShieldCheck size={20} />
          <div>
            <strong>
              {w.requisitions.filter((r) => r.status === "Pending").length} parts requests awaiting
              Director authorization
            </strong>
            <p>Procurement is held until parts are authorized.</p>
          </div>
          <Button asChild variant="link" className="band-action">
            <Link to="/requisitions">
              View requests
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="attention-band attention-band-warning">
          <Clock size={20} />
          <div>
            <strong>Nissan Navara · BAL 5643 · Completion delayed</strong>
            <p>Rear quarter panel on order. Expected completion was 10 November.</p>
          </div>
          <Button asChild variant="link" className="band-action">
            <Link to="/procurement">
              View procurement
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="attention-band">
          <Truck size={20} />
          <div>
            <strong>
              {w.vehicles.filter((v) => v.stage === 11 && !v.released).length} vehicles awaiting
              final release authorization
            </strong>
            <p>Management approval and invoice reference are required.</p>
          </div>
          <Button asChild variant="link" className="band-action">
            <Link to="/vehicles">
              View vehicles
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
      <section className="mt-8">
        <SectionHeading title="Recent workshop activity" />
        {w.activities.map((a, i) => (
          <div className="activity-row" key={i}>
            <FileText />
            <div className="flex-1">
              <p>{a.text}</p>
              <small>{a.detail}</small>
            </div>
            <small>{a.time}</small>
          </div>
        ))}
      </section>
    </>
  );
}
