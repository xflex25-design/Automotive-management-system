import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Wrench, Package, ClipboardList, CheckCircle2, Plus, RotateCcw, Search } from "./fa-icons";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWorkspace } from "./workspace-context";
import {
  PageHeading,
  SectionHeading,
  Metrics,
  DataTable,
  EmptyState,
  VehicleCell,
  Status,
  TableFooter,
  ToolbarSearch,
} from "./shared";
import {
  departments,
  nextSortState,
  sortRecords,
  type JobCard,
  type SortState,
} from "@/lib/workshop";
import { EmployeeScratchpad } from "./employee-scratchpad";

type JobSortKey = "id" | "project" | "work" | "status" | "date";
type ReqSortKey = "id" | "vehicle" | "part" | "quantity" | "status" | "date";

export function EmployeeDashboard() {
  const {
    employeeDepartment,
    setEmployeeDepartment,
    vehicles,
    jobs,
    setJobs,
    requisitions,
    addActivity,
    loading,
  } = useWorkspace();

  const [selectedJobForProgress, setSelectedJobForProgress] = useState<JobCard | null>(null);
  const [newProgress, setNewProgress] = useState<number>(50);
  const [newStatus, setNewStatus] = useState<string>("In progress");
  const [progressNote, setProgressNote] = useState<string>("");

  const [jobFilterTab, setJobFilterTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [jobSort, setJobSort] = useState<SortState<JobSortKey>>(null);
  const [reqSort, setReqSort] = useState<SortState<ReqSortKey>>(null);

  const departmentJobs = useMemo(() => {
    return jobs.filter(
      (job) =>
        job.department.toLowerCase() === employeeDepartment.toLowerCase() ||
        job.department === "Workshop" ||
        !job.department,
    );
  }, [jobs, employeeDepartment]);

  const filteredAndSortedJobs = useMemo(() => {
    const result = departmentJobs.filter((job) => {
      const vehicle = vehicles.find((v) => v.id === job.vehicleId);

      // Tab filtering
      if (jobFilterTab !== "All") {
        const normStatus = job.status.toLowerCase();
        if (jobFilterTab === "Pending") {
          if (!normStatus.includes("pending") && !normStatus.includes("awaiting")) return false;
        } else if (jobFilterTab === "Approved") {
          if (!normStatus.includes("approved") && !normStatus.includes("complete")) return false;
        } else if (jobFilterTab === "Flagged") {
          if (
            !normStatus.includes("rework") &&
            !normStatus.includes("flag") &&
            !normStatus.includes("reject")
          )
            return false;
        } else if (jobFilterTab === "In progress") {
          if (!normStatus.includes("progress")) return false;
        }
      }

      // Search query filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = job.id.toLowerCase().includes(q);
        const matchesWork = job.work.toLowerCase().includes(q);
        const matchesDue = (job.due || "").toLowerCase().includes(q);
        const matchesStatus = job.status.toLowerCase().includes(q);
        const matchesVehicle =
          vehicle &&
          (vehicle.make.toLowerCase().includes(q) ||
            vehicle.plate.toLowerCase().includes(q) ||
            vehicle.customer.toLowerCase().includes(q) ||
            vehicle.received.toLowerCase().includes(q));

        if (!matchesId && !matchesWork && !matchesDue && !matchesStatus && !matchesVehicle) {
          return false;
        }
      }

      return true;
    });

    return sortRecords(result, jobSort, (job, key) => {
      switch (key) {
        case "id":
          return job.id;
        case "project": {
          const vehicle = vehicles.find((v) => v.id === job.vehicleId);
          return `${vehicle?.make ?? ""} ${vehicle?.customer ?? ""}`;
        }
        case "work":
          return job.work;
        case "status":
          return job.status;
        case "date":
          return job.due || "";
      }
    });
  }, [departmentJobs, vehicles, jobFilterTab, searchQuery, jobSort]);

  const departmentRequisitions = useMemo(() => {
    const filtered = requisitions.filter(
      (req) => req.department.toLowerCase() === employeeDepartment.toLowerCase(),
    );
    return sortRecords(filtered, reqSort, (req, key) => {
      switch (key) {
        case "id":
          return req.id;
        case "vehicle":
          return req.vehicleId;
        case "part":
          return req.part;
        case "quantity":
          return req.quantity;
        case "status":
          return req.status;
        case "date":
          return req.date;
      }
    });
  }, [requisitions, employeeDepartment, reqSort]);

  const activeCount = departmentJobs.filter(
    (j) => !["COMPLETED", "CANCELLED", "CLOSED"].includes(j.status.toUpperCase()),
  ).length;

  const pendingReqCount = departmentRequisitions.filter((r) => r.status === "Pending").length;

  function handleClearAllFilters() {
    setJobFilterTab("All");
    setSearchQuery("");
    setJobSort(null);
    toast.success("Filters cleared: showing all department records");
  }

  function handleUpdateProgress(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJobForProgress) return;
    setJobs((prev) =>
      prev.map((j) => (j.id === selectedJobForProgress.id ? { ...j, status: newStatus } : j)),
    );
    addActivity({
      text: `${employeeDepartment} updated job ${selectedJobForProgress.id} to ${newStatus} (${newProgress}%)`,
      detail: `${employeeDepartment} · ${progressNote || "Daily progress update recorded"}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    toast.success(
      `Job ${selectedJobForProgress.id} progress updated to ${newProgress}% (${newStatus})`,
    );
    setSelectedJobForProgress(null);
    setProgressNote("");
  }

  const isFiltered = jobFilterTab !== "All" || Boolean(searchQuery.trim()) || jobSort !== null;

  return (
    <div className="space-y-6 pb-12">
      <PageHeading
        title={`${employeeDepartment} Department Portal`}
        subtitle={`Manage repair tasks, log daily progress, and submit parts requisitions for the ${employeeDepartment} workshop floor.`}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <EmployeeScratchpad department={employeeDepartment} />
          <select
            aria-label="Select employee department"
            className="h-9 px-3 bg-background border border-[#d1d5db] rounded-[5px] text-sm font-normal text-foreground focus:outline-none focus:border-primary"
            value={employeeDepartment}
            onChange={(e) => {
              setEmployeeDepartment(e.target.value);
              toast.success(`Switched to ${e.target.value} department view`);
            }}
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </PageHeading>

      <Metrics
        items={[
          {
            label: "Active Department Jobs",
            value: activeCount,
            hint: `${departmentJobs.length} total assigned to floor`,
            icon: Wrench,
          },
          {
            label: "Completed Jobs",
            value: departmentJobs.length - activeCount,
            hint: departmentJobs.length
              ? `${Math.round(((departmentJobs.length - activeCount) / departmentJobs.length) * 100)}% floor completion`
              : "No jobs assigned yet",
            icon: CheckCircle2,
            tone: "success",
          },
          {
            label: "Pending Requisitions",
            value: pendingReqCount,
            hint: `${departmentRequisitions.length} total requisitions`,
            icon: Package,
            tone: pendingReqCount > 0 ? "warning" : "default",
          },
          {
            label: "Department Efficiency",
            value: departmentJobs.length
              ? `${Math.round(((departmentJobs.length - activeCount) / departmentJobs.length) * 100)}%`
              : "0%",
            hint: "Live job completion index",
            icon: ClipboardList,
          },
        ]}
      />

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SectionHeading
            title="Department Job Queue"
            subtitle="Active repair orders and job cards assigned to your department."
          />
          <Link to="/job-cards">
            <Button variant="outline" size="sm" className="gap-2">
              <ClipboardList size={14} /> View All Job Cards
            </Button>
          </Link>
        </div>

        {/* Filter Tabs, Search Bar, and Clear All Filters Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-muted border border-border rounded-[6px] overflow-x-auto max-w-full">
              {["All", "Pending", "In progress", "Approved", "Flagged"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setJobFilterTab(tab)}
                  className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap rounded-[4px] transition-colors cursor-pointer ${
                    jobFilterTab === tab
                      ? "bg-background text-primary shadow-none border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                className="gap-1.5"
                title="Reset search and filters"
              >
                <RotateCcw size={13} />
                Clear All Filters
              </Button>
            )}
          </div>

          <ToolbarSearch
            ariaLabel="Search department jobs"
            placeholder="Search project name, date, ID..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        <DataTable<JobSortKey>
          headers={[
            { label: "Job Card", sortKey: "id" },
            { label: "Project & Customer", sortKey: "project" },
            { label: "Work Description", sortKey: "work" },
            { label: "Status", sortKey: "status" },
            { label: "Submission / Due Date", sortKey: "date" },
            "Actions",
          ]}
          loading={loading}
          sort={jobSort}
          onSort={(key) => setJobSort((current) => nextSortState(current, key))}
          empty={filteredAndSortedJobs.length === 0}
          emptyState={
            isFiltered ? (
              <EmptyState
                icon={Search}
                tone="muted"
                title="No jobs match your filters"
                description="Try switching status tabs, clearing your search query, or resetting column sorting."
                action={
                  <Button variant="outline" size="sm" onClick={handleClearAllFilters}>
                    <RotateCcw />
                    Clear All Filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Wrench}
                title={`No jobs in ${employeeDepartment}`}
                description={`There are currently no repair orders assigned to the ${employeeDepartment} department.`}
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/job-cards">
                      <ClipboardList />
                      View All Job Cards
                    </Link>
                  </Button>
                }
              />
            )
          }
        >
          {filteredAndSortedJobs.map((job) => {
            const vehicle = vehicles.find((v) => v.id === job.vehicleId);
            return (
              <tr key={job.id}>
                <td>
                  <span className="tabular-nums font-semibold text-foreground">{job.id}</span>
                </td>
                <td>
                  {vehicle ? <VehicleCell vehicle={vehicle} /> : <span>{job.vehicleId}</span>}
                </td>
                <td>
                  <span className="text-muted-foreground max-w-xs truncate block">{job.work}</span>
                </td>
                <td>
                  <Status>{job.status}</Status>
                </td>
                <td>
                  <span className="tabular-nums text-muted-foreground">
                    {job.due || "14 Nov 2026"}
                  </span>
                </td>
                <td>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedJobForProgress(job);
                      setNewStatus(job.status);
                    }}
                  >
                    Update Progress
                  </Button>
                </td>
              </tr>
            );
          })}
        </DataTable>

        <TableFooter count={filteredAndSortedJobs.length} label="jobs" />
      </section>

      {/* Progress Submission Modal */}
      {selectedJobForProgress && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="registration-panel max-w-lg w-full shadow-xl overflow-hidden">
            <div className="registration-header">
              <h3>Update Progress · {selectedJobForProgress.id}</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Close modal"
                onClick={() => setSelectedJobForProgress(null)}
              >
                ✕
              </Button>
            </div>
            <form
              onSubmit={handleUpdateProgress}
              onReset={(e) => {
                e.preventDefault();
                setNewStatus(selectedJobForProgress.status);
                setNewProgress(50);
                setProgressNote("");
              }}
            >
              <div className="registration-stack">
                <div className="registration-row-compact">
                  <label htmlFor="emp-task-status" className="registration-label">
                    Task Status <span className="registration-required">*</span>
                  </label>
                  <select
                    id="emp-task-status"
                    className="registration-input w-full"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="In progress">In progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Awaiting parts">Awaiting parts</option>
                    <option value="Approved">Approved</option>
                    <option value="Complete">Complete</option>
                    <option value="Flagged">Flagged</option>
                    <option value="Rework required">Rework required</option>
                  </select>
                </div>

                <div className="registration-row-compact">
                  <label htmlFor="emp-task-progress" className="registration-label">
                    Progress ({newProgress}%)
                  </label>
                  <input
                    id="emp-task-progress"
                    type="range"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => setNewProgress(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="registration-row-compact registration-row-top">
                  <label htmlFor="emp-task-note" className="registration-label">
                    Progress Note
                  </label>
                  <textarea
                    id="emp-task-note"
                    rows={3}
                    className="registration-textarea w-full"
                    placeholder="Describe parts fitted, repairs performed, or technician observations..."
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="registration-actions-compact">
                <Button type="submit" className="registration-submit-btn">
                  Submit
                </Button>
                <Button type="reset" variant="outline" className="registration-reset-btn">
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="registration-reset-btn"
                  onClick={() => setSelectedJobForProgress(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Parts Requisitions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeading
            title="Department Parts Requisitions"
            subtitle="Recent parts requests submitted by your department."
          />
          <Link to="/requisitions">
            <Button size="sm" className="gap-2">
              <Plus size={14} /> New Requisition
            </Button>
          </Link>
        </div>

        <DataTable<ReqSortKey>
          headers={[
            { label: "Requisition", sortKey: "id" },
            { label: "Vehicle", sortKey: "vehicle" },
            { label: "Part Name", sortKey: "part" },
            { label: "Quantity", sortKey: "quantity", align: "right" },
            { label: "Status", sortKey: "status" },
            { label: "Date", sortKey: "date" },
          ]}
          loading={loading}
          sort={reqSort}
          onSort={(key) => setReqSort((current) => nextSortState(current, key))}
          empty={departmentRequisitions.length === 0}
          emptyState={
            <EmptyState
              icon={Package}
              title={`No parts requisitions for ${employeeDepartment}`}
              description="Submit a parts requisition when replacement components or consumables are needed for a repair."
              action={
                <Button size="sm" asChild>
                  <Link to="/requisitions">
                    <Plus />
                    New Requisition
                  </Link>
                </Button>
              }
            />
          }
        >
          {departmentRequisitions.map((req) => (
            <tr key={req.id}>
              <td>
                <span className="tabular-nums font-semibold text-foreground">{req.id}</span>
              </td>
              <td>
                <span className="text-foreground">{req.vehicleId}</span>
              </td>
              <td>
                <span className="text-foreground font-medium">{req.part}</span>
              </td>
              <td className="text-right tabular-nums">
                <span className="text-muted-foreground">{req.quantity}</span>
              </td>
              <td>
                <Status>{req.status}</Status>
              </td>
              <td>
                <span className="tabular-nums text-muted-foreground">{req.date}</span>
              </td>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}
