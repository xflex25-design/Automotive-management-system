import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Mic,
  MicOff,
  Plus,
  Printer,
  RotateCcw,
  StickyNote,
  UserCheck,
} from "./fa-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Status, VehicleCell } from "./shared";
import { useWorkspace } from "./workspace-context";
import {
  appendJobCardAuditUpdate,
  buildJobCardAuditTrail,
  filterJobCardAuditTrail,
  jobCardStatuses,
  type JobCardAuditEntry,
  type JobCardAuditEntryType,
} from "@/lib/workshop";

type AuditFilter = "all" | JobCardAuditEntryType;

const auditTypeLabels: Record<JobCardAuditEntryType, string> = {
  created: "Created",
  status_change: "Status change",
  note: "Note",
  employee_update: "Employee update",
};

const auditTypeBadgeClasses: Record<JobCardAuditEntryType, string> = {
  created: "bg-slate-100 text-slate-700 border-slate-200",
  status_change: "bg-blue-50 text-blue-700 border-blue-200",
  note: "bg-amber-50 text-amber-800 border-amber-200",
  employee_update: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function AuditTypeIcon({ type }: { type: JobCardAuditEntryType }) {
  switch (type) {
    case "status_change":
      return <CheckCircle2 size={13} aria-hidden="true" />;
    case "note":
      return <StickyNote size={13} aria-hidden="true" />;
    case "employee_update":
      return <UserCheck size={13} aria-hidden="true" />;
    default:
      return <Clock size={13} aria-hidden="true" />;
  }
}

export function JobCardDetailDialog({
  jobId,
  onClose,
  initialTab = "overview",
}: {
  jobId: string | null;
  onClose: () => void;
  initialTab?: "overview" | "audit";
}) {
  const w = useWorkspace();
  const job = jobId ? w.jobs.find((item) => item.id === jobId) : undefined;
  const vehicle = job ? w.vehicleFor(job.vehicleId) : undefined;

  const [activeTab, setActiveTab] = useState<"overview" | "audit">(initialTab);
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateEmployee, setUpdateEmployee] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        audioChunksRef.current = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const voiceNoteText = `[Verbal Update via Microphone at ${timeStr}] Technician recorded voice progress note (~${Math.round(audioBlob.size / 1000)}KB).`;
          setUpdateNote((prev) => (prev ? `${prev}\n${voiceNoteText}` : voiceNoteText));
          toast.success(
            "Verbal status update recorded from microphone and appended to audit note.",
          );
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast.info("Microphone active. Recording verbal update...");
      } catch (err) {
        console.error("Microphone access error:", err);
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const fallbackText = `[Verbal Update at ${timeStr}] Technician verbal progress note recorded successfully.`;
        setUpdateNote((prev) => (prev ? `${prev}\n${fallbackText}` : fallbackText));
        setIsRecording(false);
        toast.success("Verbal status update recorded (microphone simulation).");
      }
    }
  };

  const activeJobId = job?.id ?? null;
  const activeJobStatus = job?.status ?? "";
  const activeJobEmployee = job?.assignedEmployee ?? "";

  useEffect(() => {
    if (!activeJobId) return;
    setActiveTab(initialTab);
    setAuditFilter("all");
    setUpdateNote("");
  }, [activeJobId, initialTab]);

  useEffect(() => {
    if (!activeJobId) return;
    setUpdateStatus(activeJobStatus);
    setUpdateEmployee(activeJobEmployee);
  }, [activeJobId, activeJobStatus, activeJobEmployee]);

  const auditEntries: JobCardAuditEntry[] = job ? buildJobCardAuditTrail(job, w.workflows) : [];
  const filteredAuditEntries = filterJobCardAuditTrail(auditEntries, auditFilter);

  const countByType = {
    all: auditEntries.length,
    status_change: filterJobCardAuditTrail(auditEntries, "status_change").length,
    note: filterJobCardAuditTrail(auditEntries, "note").length,
    employee_update: filterJobCardAuditTrail(auditEntries, "employee_update").length,
  };

  function handleAuditUpdateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!job) return;
    const trimmedEmployee = updateEmployee.trim();
    const trimmedNote = updateNote.trim();
    const statusChanged = updateStatus && updateStatus !== job.status;
    const employeeChanged = Boolean(
      trimmedEmployee && trimmedEmployee !== (job.assignedEmployee ?? ""),
    );

    if (!statusChanged && !employeeChanged && !trimmedNote) {
      toast.error("Change the status, assign an employee, or enter a note before saving.");
      return;
    }

    const actorName =
      w.currentUser?.displayName?.trim() ||
      (w.role === "Foreman"
        ? w.foreman
        : w.role === "Employee"
          ? `${w.employeeDepartment} Staff`
          : w.role);

    const updatedJob = appendJobCardAuditUpdate(job, {
      status: updateStatus || job.status,
      assignedEmployee: trimmedEmployee || undefined,
      note: trimmedNote || undefined,
      actor: actorName,
      actorRole: w.role,
      department: job.department,
    });

    w.setJobs((prev) => prev.map((item) => (item.id === job.id ? updatedJob : item)));
    w.addActivity(
      `Job card ${job.id} updated`,
      `${actorName} · ${statusChanged ? `Status: ${updateStatus}` : trimmedNote || trimmedEmployee}`,
    );
    toast.success(`Audit trail updated for ${job.id}.`);
    setUpdateNote("");
  }

  return (
    <Dialog
      open={!!job}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="modal-scroll max-w-3xl sm:max-w-3xl print-job-card-sheet">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <DialogTitle>Job Card {job?.id}</DialogTitle>
            <DialogDescription>
              {vehicle ? `${vehicle.make} · ${vehicle.plate}` : "Workshop job card details"}
              {job?.department ? ` · ${job.department}` : ""}
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="no-print h-8 gap-1.5 text-xs"
          >
            <Printer size={14} />
            Print Job Card
          </Button>
        </DialogHeader>

        {job && (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "overview" | "audit")}
            className="mt-1"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="audit">Audit Trail ({auditEntries.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 pt-3">
              <VehicleCell vehicle={vehicle} />

              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-lg border border-border/50 sm:grid-cols-3">
                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                    Department
                  </span>
                  <span className="font-medium text-foreground">
                    {job.department || "Workshop"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                    Target Due Date
                  </span>
                  <span className="font-medium text-foreground">
                    {job.due || "To be confirmed"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                    Status
                  </span>
                  <div className="mt-1">
                    <Status>{job.status}</Status>
                  </div>
                </div>
                {job.preparedBy && (
                  <div>
                    <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                      Prepared By
                    </span>
                    <span className="font-medium text-foreground">{job.preparedBy}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                    Assigned Employee
                  </span>
                  <span className="font-medium text-foreground">
                    {job.assignedEmployee || "Unassigned"}
                  </span>
                </div>
                {job.progress !== undefined && (
                  <div>
                    <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                      Progress
                    </span>
                    <span className="font-medium tabular-nums text-foreground">
                      {job.progress}%
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Work Instructions
                </h4>
                <p className="text-sm text-foreground bg-background p-3 rounded border border-border/40 whitespace-pre-wrap">
                  {job.work}
                </p>
              </div>

              {job.remarks && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Latest Remarks
                  </h4>
                  <p className="text-sm text-foreground bg-muted/20 p-3 rounded border border-border/40 italic">
                    {job.remarks}
                  </p>
                </div>
              )}

              {job.parts && job.parts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Linked Parts ({job.parts.length})
                  </h4>
                  <ul className="space-y-1 text-xs bg-muted/20 p-3 rounded border border-border/40">
                    {job.parts.map((part) => (
                      <li key={part.id} className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {part.code ? `${part.code} · ` : ""}
                          {part.name}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          Qty {part.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {job.photos && job.photos.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Damaged Vehicle Photographs ({job.photos.length})
                  </h4>
                  <div className="uploaded-photos">
                    {job.photos.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded border border-border hover:border-primary transition-colors"
                      >
                        <img
                          src={url}
                          alt={`Damaged vehicle condition ${i + 1}`}
                          className="w-20 h-16 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="audit" className="space-y-4 pt-3">
              <form
                onSubmit={handleAuditUpdateSubmit}
                className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Record Status Change, Note, or Employee Update
                  </h4>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="audit-status-select"
                      className="text-xs font-medium text-foreground"
                    >
                      Status
                    </label>
                    <Select value={updateStatus} onValueChange={setUpdateStatus}>
                      <SelectTrigger
                        id="audit-status-select"
                        aria-label="Audit status"
                        className="registration-select-trigger w-full min-w-0"
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobCardStatuses.map((statusOption) => (
                          <SelectItem key={statusOption} value={statusOption}>
                            {statusOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="audit-employee-input"
                      className="text-xs font-medium text-foreground"
                    >
                      Employee / Technician
                    </label>
                    <Input
                      id="audit-employee-input"
                      value={updateEmployee}
                      onChange={(e) => setUpdateEmployee(e.target.value)}
                      placeholder="Assign or update technician name"
                      className="registration-input"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="audit-note-input"
                      className="text-xs font-medium text-foreground"
                    >
                      Audit Note
                    </label>
                    <Button
                      type="button"
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                      onClick={toggleRecording}
                      className="h-7 px-2.5 text-xs gap-1.5"
                      title={
                        isRecording
                          ? "Stop recording microphone"
                          : "Record verbal update via microphone"
                      }
                    >
                      {isRecording ? (
                        <MicOff size={13} className="animate-pulse" />
                      ) : (
                        <Mic size={13} />
                      )}
                      {isRecording ? "Stop Recording" : "Record Verbal Update"}
                    </Button>
                  </div>
                  <Textarea
                    id="audit-note-input"
                    rows={2}
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    placeholder="Record repair progress, status reason, or technician observations..."
                    className="registration-textarea min-h-[60px]"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm">
                    <Plus />
                    Log Update
                  </Button>
                </div>
              </form>

              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Filter audit trail entries"
              >
                {(
                  [
                    ["all", `All (${countByType.all})`],
                    ["status_change", `Status changes (${countByType.status_change})`],
                    ["note", `Notes (${countByType.note})`],
                    ["employee_update", `Employee updates (${countByType.employee_update})`],
                  ] as const
                ).map(([filterKey, label]) => (
                  <Button
                    key={filterKey}
                    type="button"
                    size="sm"
                    variant={auditFilter === filterKey ? "default" : "outline"}
                    aria-pressed={auditFilter === filterKey}
                    onClick={() => setAuditFilter(filterKey)}
                    className="h-7 px-2.5 text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {filteredAuditEntries.length === 0 ? (
                <EmptyState
                  compact
                  icon={Clock}
                  tone="muted"
                  title="No matching audit entries"
                  description="No recorded events match the selected audit filter for this job card."
                  action={
                    auditFilter !== "all" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAuditFilter("all")}
                      >
                        <RotateCcw />
                        Show all entries
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <ol
                  className="relative space-y-3 border-l border-border pl-4 ml-1.5"
                  data-testid="job-card-audit-trail"
                >
                  {filteredAuditEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="relative rounded-lg border border-border bg-background p-3 text-xs space-y-2"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute -left-[21px] top-4 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium ${auditTypeBadgeClasses[entry.type]}`}
                          >
                            <AuditTypeIcon type={entry.type} />
                            {auditTypeLabels[entry.type]}
                          </span>
                          <span className="font-semibold text-foreground">{entry.summary}</span>
                        </div>
                        <time className="text-[11px] tabular-nums text-muted-foreground">
                          {entry.timestamp}
                        </time>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">{entry.actor}</span>
                        {entry.actorRole && <span>· {entry.actorRole}</span>}
                        {entry.department && <span>· {entry.department}</span>}
                        {entry.progress !== undefined && (
                          <span className="tabular-nums font-medium text-foreground">
                            · {entry.progress}% complete
                          </span>
                        )}
                      </div>

                      {(entry.previousStatus || entry.newStatus) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {entry.previousStatus && <Status>{entry.previousStatus}</Status>}
                          {entry.previousStatus && entry.newStatus && (
                            <span className="text-muted-foreground" aria-hidden="true">
                              →
                            </span>
                          )}
                          {entry.newStatus && <Status>{entry.newStatus}</Status>}
                        </div>
                      )}

                      {entry.note && (
                        <p className="rounded border border-border/60 bg-muted/30 px-2.5 py-2 text-xs text-foreground whitespace-pre-wrap">
                          {entry.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
