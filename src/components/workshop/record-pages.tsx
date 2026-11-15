import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Plus,
  ArrowUpRight,
  Send,
  Check,
  ShieldCheck,
  Save,
  X,
  Printer,
  FileText,
  Archive,
  ClipboardList,
  Package,
  ClipboardCheck,
  Search,
  RotateCcw,
  Camera,
  Upload,
} from "./fa-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { backendApi } from "@/lib/api";
import { useWorkspace } from "./workspace-context";
import {
  PageHeading,
  DataTable,
  EmptyState,
  VehicleCell,
  Status,
  TableFooter,
  ToolbarSearch,
  ExportButton,
} from "./shared";
import { VehicleDetail } from "./vehicle-detail";
import { cn } from "@/lib/utils";

const QUOTATION_VAT_RATE = 16;
let nextDraftLineSeq = 1;
const createDraftLineRowId = () => `qline-${nextDraftLineSeq++}`;
type QuotationDraftLine = {
  rowId: string;
  item: string;
  description: string;
  quantity: string;
  unitPrice: string;
};
const initialQuotationLines = (): QuotationDraftLine[] => [
  {
    rowId: createDraftLineRowId(),
    quantity: "1",
    item: "air filter",
    description: "ford",
    unitPrice: "450.00",
  },
  {
    rowId: createDraftLineRowId(),
    quantity: "1",
    item: "oil filter",
    description: "ford",
    unitPrice: "250.00",
  },
  {
    rowId: createDraftLineRowId(),
    quantity: "1",
    item: "fuel filter",
    description: "ford",
    unitPrice: "250.00",
  },
  {
    rowId: createDraftLineRowId(),
    quantity: "1",
    item: "cabin filter",
    description: "ford",
    unitPrice: "350.00",
  },
  {
    rowId: createDraftLineRowId(),
    quantity: "2",
    item: "wipers",
    description: "ford",
    unitPrice: "350.00",
  },
  {
    rowId: createDraftLineRowId(),
    quantity: "1",
    item: "brake pads",
    description: "ford",
    unitPrice: "1950.00",
  },
  {
    rowId: createDraftLineRowId(),
    quantity: "1",
    item: "brake pads",
    description: "ford",
    unitPrice: "1950.00",
  },
  {
    rowId: createDraftLineRowId(),
    quantity: "1",
    item: "brake booster",
    description: "ford",
    unitPrice: "1950.00",
  },
  {
    rowId: createDraftLineRowId(),
    quantity: "1",
    item: "labour",
    description: "ford",
    unitPrice: "2000.00",
  },
];
const emptyQuotationLine = (): QuotationDraftLine => ({
  rowId: createDraftLineRowId(),
  item: "",
  description: "",
  quantity: "1",
  unitPrice: "",
});
type PaperQuotationFields = {
  companyName: string;
  address: string;
  email: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  vatNumber: string;
  quoteNo: string;
  date: string;
  salesperson: string;
  billTo1: string;
  billTo2: string;
  shipTo1: string;
  shipTo2: string;
  shipTo3: string;
  preparedBy: string;
  signature: string;
  invoiceReference: string;
};
type PaperInventoryFields = {
  jobNo: string;
  registrationNo: string;
  make: string;
  date: string;
  ownedBy: string;
  driver: string;
  accessories: Array<{ name: string; present: "" | "Present" | "Missing"; quantity?: string }>;
  fuelIn: string;
  fuelOut: string;
  kmsIn: string;
  kmsOut: string;
  damages: Array<{ area: string; type: string }>;
  jobToBeDone: string[];
  additional: Array<{ name: string; present: "" | "Present" | "Missing" }>;
  remarks: string[];
  deliveredBy: string;
  deliveredSignature: string;
  deliveredTel: string;
  receivedCheckedBy: string;
  collectedBy: string;
  collectedSignature: string;
  collectedDate: string;
  collectedPhone: string;
  releasedBy: string;
  timeOut: string;
};
type PaperInventoryRecord = {
  id: string;
  vehicleId: string;
  items: string;
  condition: string;
  date: string;
  paperFields: PaperInventoryFields;
};
const initialPaperFields = (): PaperQuotationFields => ({
  companyName: "Hirider 4x4 World (Kwacha)",
  address: "Makeni Road, Lusaka",
  email: "mkessa@hotmail.com",
  phone: "+260 966 766 693",
  bankName: "Access Bank",
  accountNumber: "0060211407831",
  vatNumber: "1004021290",
  quoteNo: "12844",
  date: "13/10/2026",
  salesperson: "PRECIOUS",
  billTo1: "RTSA",
  billTo2: "RTSA",
  shipTo1: "RTSA",
  shipTo2: "FORD RANGER",
  shipTo3: "BAK 6213",
  preparedBy: "PRECIOUS",
  signature: "",
  invoiceReference: "",
});
const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;
import {
  money,
  departments,
  canCreateInventory,
  canDecideParts,
  nextSortState,
  sortRecords,
  type SortState,
  type Requisition,
  type Quotation,
  type Vehicle,
  type Inspection,
} from "@/lib/workshop";

type RecordKind = "quotations" | "inventory" | "jobs" | "requisitions" | "inspections";
const config = {
  quotations: {
    title: "Quotation Management",
    subtitle: "Prepare quotations and record customer authorization",
    singular: "quotation",
    headers: [
      { label: "Quotation", sortKey: "id" },
      { label: "Vehicle", sortKey: "vehicle" },
      { label: "Customer", sortKey: "customer" },
      { label: "Amount", sortKey: "amount", align: "right" },
      { label: "Status", sortKey: "status" },
      "Actions",
    ],
  },
  inventory: {
    title: "Inventory Cards",
    subtitle: "Vehicle belongings, accessories and condition records",
    singular: "inventory card",
    headers: [
      { label: "Inventory card", sortKey: "id" },
      { label: "Vehicle", sortKey: "vehicle" },
      { label: "Items recorded", sortKey: "items" },
      { label: "Created", sortKey: "date" },
      "Actions",
    ],
  },
  jobs: {
    title: "Job Card Management",
    subtitle: "Assign repair work to the relevant workshop departments",
    singular: "job card",
    headers: [
      { label: "Job card", sortKey: "id" },
      { label: "Vehicle", sortKey: "vehicle" },
      { label: "Work instructions", sortKey: "work" },
      { label: "Status", sortKey: "status" },
      "Actions",
    ],
  },
  requisitions: {
    title: "Parts Requisitions",
    subtitle: "Required parts, director authorization and purchasing status",
    singular: "parts requisition",
    headers: [
      { label: "Requisition", sortKey: "id" },
      { label: "Vehicle", sortKey: "vehicle" },
      { label: "Part / item", sortKey: "part" },
      { label: "Qty", sortKey: "quantity", align: "right" },
      { label: "Status", sortKey: "status" },
      "Actions",
    ],
  },
  inspections: {
    title: "Vehicle Inspections",
    subtitle: "Final checks, inspection results and foreman sign-off",
    singular: "inspection",
    headers: [
      { label: "Inspection", sortKey: "id" },
      { label: "Vehicle", sortKey: "vehicle" },
      { label: "Foreman", sortKey: "foreman" },
      { label: "Date", sortKey: "date" },
      { label: "Result", sortKey: "result" },
      "Actions",
    ],
  },
} as const;

type QuotationItemRow = NonNullable<Quotation["items"]>[number];
type QuotationItemSortKey = "quantity" | "item" | "description" | "unitPrice" | "total";

function QuotationItemsTable({
  items,
  rowKeyPrefix,
  className,
}: {
  items: readonly QuotationItemRow[];
  rowKeyPrefix: string;
  className?: string;
}) {
  const [itemSort, setItemSort] = useState<SortState<QuotationItemSortKey>>(null);
  const sortedItems = sortRecords(items, itemSort, (entry, key) => {
    switch (key) {
      case "quantity":
        return entry.quantity;
      case "item":
        return entry.item;
      case "description":
        return entry.description;
      case "unitPrice":
        return entry.unitPrice;
      case "total":
        return entry.lineTotal ?? entry.quantity * entry.unitPrice;
    }
  });
  const toggle = (key: QuotationItemSortKey) =>
    setItemSort((current) => nextSortState(current, key));

  return (
    <div>
      <Table className={className}>
        <TableHeader>
          <TableRow>
            <TableHead
              align="right"
              sortDirection={itemSort?.key === "quantity" ? itemSort.direction : null}
              onSort={() => toggle("quantity")}
            >
              Qty
            </TableHead>
            <TableHead
              sortDirection={itemSort?.key === "item" ? itemSort.direction : null}
              onSort={() => toggle("item")}
            >
              Item
            </TableHead>
            <TableHead
              sortDirection={itemSort?.key === "description" ? itemSort.direction : null}
              onSort={() => toggle("description")}
            >
              Description
            </TableHead>
            <TableHead
              align="right"
              sortDirection={itemSort?.key === "unitPrice" ? itemSort.direction : null}
              onSort={() => toggle("unitPrice")}
            >
              Unit Price
            </TableHead>
            <TableHead
              align="right"
              sortDirection={itemSort?.key === "total" ? itemSort.direction : null}
              onSort={() => toggle("total")}
            >
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((entry, index) => (
            <TableRow key={`${rowKeyPrefix}-${entry.item}-${index}`}>
              <TableCell className="text-right tabular-nums">{entry.quantity}</TableCell>
              <TableCell>{entry.item}</TableCell>
              <TableCell>{entry.description}</TableCell>
              <TableCell className="text-right tabular-nums">{money(entry.unitPrice)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {money(entry.lineTotal ?? entry.quantity * entry.unitPrice)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {sortedItems.length === 0 && (
        <div className="empty-state-wrap">
          <EmptyState
            compact
            icon={FileText}
            tone="muted"
            title="No quotation line items"
            description="No itemized parts or labour entries are recorded on this quotation yet."
          />
        </div>
      )}
    </div>
  );
}
export function RecordsPage({ kind }: { kind: RecordKind }) {
  const w = useWorkspace();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState<SortState>(null);
  const [create, setCreate] = useState(false);
  useEffect(() => {
    setSort(null);
  }, [kind]);
  const [paperInventory, setPaperInventory] = useState<PaperInventoryRecord[]>([]);
  const [detail, setDetail] = useState<string | null>(null);
  const [request, setRequest] = useState<Requisition | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [paperQuote, setPaperQuote] = useState<Quotation | null>(null);
  const [recordDetail, setRecordDetail] = useState<{ title: string; body: ReactNode } | null>(null);
  const [approvalView, setApprovalView] = useState<Record<string, unknown> | null>(null);
  const [approvalToken, setApprovalToken] = useState("");
  const [approvalDecisions, setApprovalDecisions] = useState<
    Record<number, "APPROVED" | "REJECTED">
  >({});
  const c = config[kind];
  const records =
    kind === "quotations"
      ? w.quotations
      : kind === "inventory"
        ? [...paperInventory, ...w.inventory]
        : kind === "jobs"
          ? w.jobs
          : kind === "requisitions"
            ? w.requisitions
            : w.inspections;
  const matches = (row: { id: string; vehicleId: string; status?: string; result?: string }) => {
    const vehicle = w.vehicleFor(row.vehicleId);
    return (
      `${row.id} ${vehicle?.make} ${vehicle?.plate} ${vehicle?.customer}`
        .toLowerCase()
        .includes(`${query} ${w.search}`.trim().toLowerCase()) &&
      (filter === "All" || row.status === filter || row.result === filter)
    );
  };
  const count = records.filter(matches).length;
  const isFiltered = Boolean(query.trim() || w.search.trim() || filter !== "All");
  const emptyMeta = {
    quotations: {
      icon: FileText,
      title: "No quotations created yet",
      description: "Prepare itemized customer quotations and record authorization status here.",
    },
    inventory: {
      icon: Archive,
      title: "No inventory cards recorded",
      description:
        "Document vehicle accessories, belongings, fuel levels, and incoming condition notes.",
    },
    jobs: {
      icon: ClipboardList,
      title: "No job cards open",
      description: "Create job cards to assign repair instructions to workshop departments.",
    },
    requisitions: {
      icon: Package,
      title: "No parts requisitions submitted",
      description:
        "Request replacement parts and consumables for director authorization and purchasing.",
    },
    inspections: {
      icon: ClipboardCheck,
      title: "No vehicle inspections recorded",
      description:
        "Record final quality checks and foreman sign-off before releasing completed vehicles.",
    },
  }[kind];
  const createLabel = kind === "inventory" ? "New vehicle inventory" : `New ${c.singular}`;
  const choices =
    kind === "quotations"
      ? ["Draft", "Awaiting approval", "Approved"]
      : kind === "requisitions"
        ? ["Pending", "Approved", "Rejected", "Ordered", "Dispatched"]
        : kind === "jobs"
          ? ["In progress", "Awaiting parts", "Complete"]
          : kind === "inspections"
            ? ["Pending", "Passed", "Rework required"]
            : [];
  function sendQuote(q: Quotation) {
    w.setQuotations((prev) =>
      prev.map((item) => (item.id === q.id ? { ...item, status: "Awaiting approval" } : item)),
    );
    w.updateVehicleStage(q.vehicleId, 2);
    w.addActivity(`Quotation marked as sent to customer`, q.id);
    toast.success("Quotation marked as sent. Awaiting customer authorization.");
  }
  return (
    <>
      <PageHeading title={c.title} subtitle={c.subtitle}>
        <ExportButton filename={kind} rows={records} />
        {w.role === "Foreman" && kind === "inventory" && (
          <Button onClick={() => setCreate(true)}>
            <Plus />
            New vehicle inventory
          </Button>
        )}
        {w.role === "Foreman" && kind !== "inventory" && (
          <Button onClick={() => setCreate(true)}>
            <Plus />
            New {c.singular}
          </Button>
        )}
      </PageHeading>
      {w.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {w.error}{" "}
          <Button size="sm" variant="outline" onClick={() => void w.refresh()}>
            Retry
          </Button>
        </div>
      )}
      <div className="toolbar">
        <ToolbarSearch
          ariaLabel={`Search ${c.title}`}
          placeholder={`Search ${c.title.toLowerCase()}...`}
          value={query}
          onChange={setQuery}
        />
        {choices.length > 0 && (
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger
              className="w-[175px] h-[38px] rounded-[6px] border-[#d1d5db] bg-background text-sm font-normal shadow-none"
              aria-label="Filter status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              {choices.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <DataTable
        headers={c.headers}
        loading={w.loading}
        sort={sort}
        onSort={(key) => setSort((current) => nextSortState(current, key))}
        empty={count === 0}
        emptyState={
          isFiltered ? (
            <EmptyState
              icon={Search}
              tone="muted"
              title={`No matching ${c.title.toLowerCase()}`}
              description="No records matched your current search term or selected status filter."
              action={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setFilter("All");
                      w.setSearch("");
                    }}
                  >
                    <RotateCcw />
                    Clear filters
                  </Button>
                  {w.role === "Foreman" && (
                    <Button size="sm" onClick={() => setCreate(true)}>
                      <Plus />
                      {createLabel}
                    </Button>
                  )}
                </>
              }
            />
          ) : (
            <EmptyState
              icon={emptyMeta.icon}
              title={emptyMeta.title}
              description={emptyMeta.description}
              action={
                w.role === "Foreman" ? (
                  <Button size="sm" onClick={() => setCreate(true)}>
                    <Plus />
                    {createLabel}
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
        {kind === "quotations" &&
          sortRecords(w.quotations.filter(matches), sort, (q, key) => {
            const vehicle = w.vehicleFor(q.vehicleId);
            switch (key) {
              case "id":
                return q.id;
              case "vehicle":
                return `${vehicle?.make ?? ""} ${vehicle?.plate ?? ""}`;
              case "customer":
                return vehicle?.customer ?? "";
              case "amount":
                return q.amount;
              case "status":
                return q.status;
              default:
                return "";
            }
          }).map((q) => (
            <tr key={q.id}>
              <td className="cell-title">{q.id}</td>
              <td>
                <VehicleCell vehicle={w.vehicleFor(q.vehicleId)} />
              </td>
              <td>{w.vehicleFor(q.vehicleId)?.customer}</td>
              <td className="cell-title text-right tabular-nums">{money(q.amount)}</td>
              <td>
                <Status>{q.status}</Status>
              </td>
              <td>
                <div className="flex items-center gap-1">
                  {w.role === "Foreman" && q.status === "Draft" && (
                    <Button size="sm" variant="outline" onClick={() => sendQuote(q)}>
                      <Send />
                      Mark sent
                    </Button>
                  )}
                  {w.role === "Foreman" && q.status === "Awaiting approval" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setApprovalView(null);
                        setApprovalToken("");
                        setApprovalDecisions({});
                        setQuote(q);
                      }}
                    >
                      Record approval
                    </Button>
                  )}
                  {kind === "quotations" && (
                    <Button size="sm" variant="outline" onClick={() => setPaperQuote(q)}>
                      <Printer />
                      Print / Preview
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Quotation details"
                    aria-label={`View ${q.id}`}
                    onClick={() =>
                      setRecordDetail({
                        title: q.id,
                        body: (
                          <>
                            <VehicleCell vehicle={w.vehicleFor(q.vehicleId)} />
                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                              <p>
                                <span className="text-muted-foreground">Bill To</span>
                                <br />
                                {w.vehicleFor(q.vehicleId)?.customer}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Ship To</span>
                                <br />
                                {w.vehicleFor(q.vehicleId)?.customer}
                                <br />
                                {w.vehicleFor(q.vehicleId)?.make} ·{" "}
                                {w.vehicleFor(q.vehicleId)?.plate}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Date</span>
                                <br />
                                {q.quotationDate
                                  ? new Date(q.quotationDate).toLocaleDateString()
                                  : "—"}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Prepared By</span>
                                <br />
                                {q.preparedByName ?? "—"}
                              </p>
                            </div>
                            <div className="mt-4 overflow-x-auto rounded-md border">
                              <QuotationItemsTable items={q.items ?? []} rowKeyPrefix={q.id} />
                            </div>
                            <div className="ml-auto mt-4 grid w-full max-w-xs grid-cols-2 gap-y-2 text-sm">
                              <span>Subtotal</span>
                              <span className="text-right">{money(q.subtotal ?? q.amount)}</span>
                              <span>VAT</span>
                              <span className="text-right">{money(q.taxAmount ?? 0)}</span>
                              <strong>Total</strong>
                              <strong className="text-right">{money(q.amount)}</strong>
                            </div>
                            <p className="mt-5 text-center text-sm">Thank you for your business.</p>
                            <div className="mt-3">
                              <Status>{q.status}</Status>
                            </div>
                            {q.approvalReference && (
                              <p className="mt-4 text-muted-foreground">{q.approvalReference}</p>
                            )}
                          </>
                        ),
                      })
                    }
                  >
                    <ArrowUpRight />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        {kind === "inventory" &&
          sortRecords([...paperInventory, ...w.inventory].filter(matches), sort, (i, key) => {
            const vehicle = w.vehicleFor(i.vehicleId);
            switch (key) {
              case "id":
                return i.id;
              case "vehicle":
                return `${vehicle?.make ?? ""} ${vehicle?.plate ?? ""}`;
              case "items":
                return i.items;
              case "date":
                return i.date;
              default:
                return "";
            }
          }).map((i) => (
            <tr key={i.id}>
              <td className="cell-title">{i.id}</td>
              <td>
                <VehicleCell vehicle={w.vehicleFor(i.vehicleId)} />
              </td>
              <td>
                <div className="max-w-[280px] whitespace-normal leading-relaxed">{i.items}</div>
              </td>
              <td>{i.date}</td>
              <td>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Inventory details"
                  aria-label={`View ${i.id}`}
                  onClick={() =>
                    setRecordDetail({
                      title: i.id,
                      body: (
                        <>
                          {"paperFields" in i && i.paperFields ? (
                            <PaperInventoryView fields={i.paperFields as PaperInventoryFields} />
                          ) : (
                            <>
                              <VehicleCell vehicle={w.vehicleFor(i.vehicleId)} />
                              <h3 className="font-semibold mt-5 mb-2">
                                Vehicle belongings & accessories
                              </h3>
                              <p>{i.items}</p>
                              <h3 className="font-semibold mt-5 mb-2">Condition record</h3>
                              <p>{i.condition}</p>
                            </>
                          )}
                        </>
                      ),
                    })
                  }
                >
                  <ArrowUpRight />
                </Button>
              </td>
            </tr>
          ))}
        {kind === "jobs" &&
          sortRecords(w.jobs.filter(matches), sort, (j, key) => {
            const vehicle = w.vehicleFor(j.vehicleId);
            switch (key) {
              case "id":
                return j.id;
              case "vehicle":
                return `${vehicle?.make ?? ""} ${vehicle?.plate ?? ""}`;
              case "work":
                return j.work;
              case "status":
                return j.status;
              default:
                return "";
            }
          }).map((j) => (
            <tr key={j.id}>
              <td className="cell-title">{j.id}</td>
              <td>
                <VehicleCell vehicle={w.vehicleFor(j.vehicleId)} />
              </td>
              <td>{j.work}</td>
              <td>
                <Status>{j.status}</Status>
              </td>
              <td>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Job card details"
                  aria-label={`View ${j.id}`}
                  onClick={() =>
                    setRecordDetail({
                      title: `Job Card ${j.id}`,
                      body: (
                        <div className="space-y-4">
                          <VehicleCell vehicle={w.vehicleFor(j.vehicleId)} />
                          <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-lg border border-border/50">
                            <div>
                              <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                                Department
                              </span>
                              <span className="font-medium text-foreground">
                                {j.department || "Workshop"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                                Target Due Date
                              </span>
                              <span className="font-medium text-foreground">
                                {j.due || "To be confirmed"}
                              </span>
                            </div>
                            {j.preparedBy && (
                              <div>
                                <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                                  Prepared By
                                </span>
                                <span className="font-medium text-foreground">{j.preparedBy}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                                Status
                              </span>
                              <div className="mt-1">
                                <Status>{j.status}</Status>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                              Work Instructions
                            </h4>
                            <p className="text-sm text-foreground bg-background p-3 rounded border border-border/40 whitespace-pre-wrap">
                              {j.work}
                            </p>
                          </div>
                          {j.remarks && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Foreman Remarks
                              </h4>
                              <p className="text-sm text-foreground bg-muted/20 p-3 rounded border border-border/40 italic">
                                {j.remarks}
                              </p>
                            </div>
                          )}
                          {j.photos && j.photos.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Damaged Vehicle Photographs ({j.photos.length})
                              </h4>
                              <div className="uploaded-photos">
                                {j.photos.map((url, i) => (
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
                        </div>
                      ),
                    })
                  }
                >
                  <ArrowUpRight />
                </Button>
              </td>
            </tr>
          ))}
        {kind === "requisitions" &&
          sortRecords(w.requisitions.filter(matches), sort, (r, key) => {
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
          }).map((r) => (
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
                <Button variant="outline" size="sm" onClick={() => setRequest(r)}>
                  View request
                  <ArrowUpRight size={12} />
                </Button>
              </td>
            </tr>
          ))}
        {kind === "inspections" &&
          sortRecords(w.inspections.filter(matches), sort, (i, key) => {
            const vehicle = w.vehicleFor(i.vehicleId);
            switch (key) {
              case "id":
                return i.id;
              case "vehicle":
                return `${vehicle?.make ?? ""} ${vehicle?.plate ?? ""}`;
              case "foreman":
                return i.foreman;
              case "date":
                return i.date;
              case "result":
                return i.result;
              default:
                return "";
            }
          }).map((i) => (
            <tr key={i.id}>
              <td className="cell-title">{i.id}</td>
              <td>
                <VehicleCell vehicle={w.vehicleFor(i.vehicleId)} />
              </td>
              <td>{i.foreman}</td>
              <td>{i.date}</td>
              <td>
                <Status>{i.result}</Status>
              </td>
              <td>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Inspection details"
                  aria-label={`View ${i.id}`}
                  onClick={() => setSelectedInspection(i)}
                >
                  <ArrowUpRight />
                </Button>
              </td>
            </tr>
          ))}
      </DataTable>
      <TableFooter count={count} />
      {kind === "inventory" && (
        <div className="attention-band mt-6">
          <ShieldCheck size={18} />
          <div>
            <strong>Customer authorization comes first</strong>
            <p>Inventory cards are generated by the backend during vehicle intake.</p>
          </div>
        </div>
      )}
      {kind === "requisitions" && (
        <div className="attention-band mt-6">
          <ShieldCheck size={18} />
          <div>
            <strong>Director authorization required</strong>
            <p>Submitted requisitions await the Director's approval before procurement.</p>
          </div>
        </div>
      )}
      {kind === "inventory" ? (
        <NewVehicleInventory
          open={create}
          onClose={() => setCreate(false)}
          onSave={(fields) => {
            const id = `INV-${Date.now()}`;
            const vehicle = w.vehicles.find(
              (item) => item.plate.toLowerCase() === fields.registrationNo.trim().toLowerCase(),
            );
            const items = fields.accessories
              .filter((item) => item.present === "Present")
              .map((item) => `${item.name}${item.quantity ? ` (${item.quantity})` : ""}`)
              .join(", ");
            const record = {
              id,
              vehicleId: vehicle?.id ?? "",
              items,
              condition: fields.damages.map((damage) => `${damage.type} ${damage.area}`).join("; "),
              date: fields.date,
            };
            setPaperInventory((previous) => [{ ...record, paperFields: fields }, ...previous]);
            toast.success(
              "Inventory captured for this session. The backend has no create endpoint yet.",
            );
            setCreate(false);
          }}
        />
      ) : (
        <CreateRecord kind={kind} open={create} onClose={() => setCreate(false)} />
      )}
      <VehicleDetail id={detail} onClose={() => setDetail(null)} />
      <RequestDetail request={request} onClose={() => setRequest(null)} allowDecision={false} />
      <InspectionDetail
        inspection={selectedInspection}
        onClose={() => setSelectedInspection(null)}
      />
      <Dialog
        open={!!recordDetail}
        onOpenChange={(o) => {
          if (!o) setRecordDetail(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{recordDetail?.title}</DialogTitle>
            <DialogDescription>Workshop record details</DialogDescription>
          </DialogHeader>
          <div className="text-sm leading-relaxed">{recordDetail?.body}</div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!paperQuote}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPaperQuote(null);
        }}
      >
        <DialogContent className="modal-scroll max-w-6xl sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Quotation preview</DialogTitle>
            <DialogDescription>Paper quotation layout</DialogDescription>
          </DialogHeader>
          {paperQuote && (
            <PaperQuotationPreview quotation={paperQuote} onPrint={() => window.print()} />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!quote}
        onOpenChange={(o) => {
          if (!o) setQuote(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record customer authorization</DialogTitle>
            <DialogDescription>
              {quote?.id} · {quote && w.vehicleFor(quote.vehicleId)?.customer}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!quote) return;
              if (!approvalView) {
                void w
                  .viewCustomerApproval(approvalToken)
                  .then(setApprovalView)
                  .catch((error: Error) => toast.error(error.message));
                return;
              }
              const items = Array.isArray(approvalView["items"])
                ? (approvalView["items"] as Record<string, unknown>[])
                : [];
              if (
                items.some(
                  (item) => !approvalDecisions[Number(item["quotationItemId"] ?? item["itemId"])],
                )
              ) {
                toast.error("Choose a decision for every quotation item.");
                return;
              }
              void w
                .submitCustomerApproval(
                  approvalToken,
                  items.map((item) => ({
                    quotationItemId: Number(item["quotationItemId"] ?? item["itemId"]),
                    decision: approvalDecisions[Number(item["quotationItemId"] ?? item["itemId"])]!,
                  })),
                )
                .then(async () => {
                  await w.refresh();
                  setQuote(null);
                  setApprovalView(null);
                  setApprovalToken("");
                  toast.success("Customer decisions submitted to the backend.");
                })
                .catch((error: Error) => toast.error(error.message));
            }}
          >
            {!approvalView ? (
              <div className="registration-row-compact pt-2">
                <label htmlFor="auth-token-input" className="registration-label">
                  Authorization Token <span className="registration-required">*</span>
                </label>
                <Input
                  id="auth-token-input"
                  required
                  value={approvalToken}
                  onChange={(e) => setApprovalToken(e.target.value)}
                  placeholder="Enter the token received by the customer"
                  className="registration-input"
                />
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {(Array.isArray(approvalView["items"])
                  ? (approvalView["items"] as Record<string, unknown>[])
                  : []
                ).map((item) => {
                  const id = Number(item["quotationItemId"] ?? item["itemId"]);
                  return (
                    <div key={id} className="registration-row-compact">
                      <span className="registration-label">
                        {String(item["description"] ?? item["itemName"] ?? `Item ${id}`)}
                      </span>
                      <Select
                        value={approvalDecisions[id] ?? ""}
                        onValueChange={(value: "APPROVED" | "REJECTED") =>
                          setApprovalDecisions((prev) => ({ ...prev, [id]: value }))
                        }
                      >
                        <SelectTrigger className="registration-select-trigger">
                          <SelectValue placeholder="Choose decision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APPROVED">Approve</SelectItem>
                          <SelectItem value="REJECTED">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="registration-actions-modal">
              <Button type="submit" className="registration-submit-btn">
                <Check />
                {approvalView ? "Submit" : "Verify token"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="registration-reset-btn"
                onClick={() => setQuote(null)}
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

const inventoryAccessories = [
  "Sparewheel",
  "Jack",
  "Jack handle",
  "Triangles",
  "Wheel spanner",
  "Fire extinguisher",
  "Tool kit",
  "Wheel covers",
  "Car mats",
];
const newPaperInventoryFields = (): PaperInventoryFields => ({
  jobNo: "",
  registrationNo: "",
  make: "",
  date: (() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  })(),
  ownedBy: "",
  driver: "",
  accessories: inventoryAccessories.map((name) => ({
    name,
    present: "",
    ...(name === "Wheel covers" || name === "Car mats" ? { quantity: "" } : {}),
  })),
  fuelIn: "",
  fuelOut: "",
  kmsIn: "",
  kmsOut: "",
  damages: Array.from({ length: 14 }, () => ({ area: "", type: "" })),
  jobToBeDone: Array.from({ length: 14 }, () => ""),
  additional: Array.from({ length: 5 }, () => ({ name: "", present: "" })),
  remarks: ["", ""],
  deliveredBy: "",
  deliveredSignature: "",
  deliveredTel: "",
  receivedCheckedBy: "",
  collectedBy: "",
  collectedSignature: "",
  collectedDate: "",
  collectedPhone: "",
  releasedBy: "",
  timeOut: "",
});

function NewVehicleInventory({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (fields: PaperInventoryFields) => void;
}) {
  const [fields, setFields] = useState(newPaperInventoryFields);
  const [accessorySort, setAccessorySort] =
    useState<SortState<"name" | "present" | "quantity">>(null);
  const setField = <K extends keyof PaperInventoryFields>(key: K, value: PaperInventoryFields[K]) =>
    setFields((current) => ({ ...current, [key]: value }));
  const sortedAccessories = sortRecords(fields.accessories, accessorySort, (item, key) => {
    switch (key) {
      case "name":
        return item.name;
      case "present":
        return item.present;
      case "quantity":
        return item.quantity ? Number(item.quantity) || item.quantity : "";
    }
  });
  const input = "h-9";
  const statusOptions = ["Present", "Missing"] as const;
  const renderStatus = (
    value: "" | "Present" | "Missing",
    onChange: (value: "Present" | "Missing") => void,
    label: string,
  ) => (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-3 whitespace-nowrap text-sm"
    >
      {statusOptions.map((status) => (
        <label key={status} className="flex items-center gap-1">
          <input
            type="radio"
            name={label}
            checked={value === status}
            onChange={() => onChange(status)}
          />
          {status === "Present" ? "✓" : "✗"} {status}
        </label>
      ))}
    </div>
  );
  const renderText = (label: string, value: string, onChange: (value: string) => void) => (
    <label className="registration-row-compact min-w-0">
      <span className="registration-label">{label}</span>
      <Input
        className="registration-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
  const renderFuel = (label: string, value: string, onChange: (value: string) => void) => (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {["E", "1/4", "1/2", "3/4", "F"].map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={label}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="modal-scroll max-w-6xl sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>New vehicle inventory</DialogTitle>
          <DialogDescription>VEHICLE INVENTORY</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(fields);
          }}
        >
          <header className="space-y-1 border-b pb-4 text-center">
            <p className="text-lg font-semibold">Hirider 4x4 World</p>
            <p>Kafue Road</p>
            <p>Cell +260 966 766 693</p>
            <p>Email mkessa@hotmail.com</p>
            <h2 className="pt-2 text-lg font-semibold tracking-wide">VEHICLE INVENTORY</h2>
          </header>
          <section className="registration-section-box">
            <div className="registration-section-title">Vehicle &amp; Customer Details</div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {renderText("JOB No.", fields.jobNo, (value) => setField("jobNo", value))}
              {renderText("Registration No.", fields.registrationNo, (value) =>
                setField("registrationNo", value),
              )}
              {renderText("Make", fields.make, (value) => setField("make", value))}
              {renderText("Date", fields.date, (value) => setField("date", value))}
              {renderText("Owned by", fields.ownedBy, (value) => setField("ownedBy", value))}
              {renderText("Driver", fields.driver, (value) => setField("driver", value))}
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">ACCESSORIES</h3>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      sortDirection={accessorySort?.key === "name" ? accessorySort.direction : null}
                      onSort={() => setAccessorySort((current) => nextSortState(current, "name"))}
                    >
                      Item
                    </TableHead>
                    <TableHead
                      sortDirection={
                        accessorySort?.key === "present" ? accessorySort.direction : null
                      }
                      onSort={() =>
                        setAccessorySort((current) => nextSortState(current, "present"))
                      }
                    >
                      Present (✓) / Missing (✗)
                    </TableHead>
                    <TableHead
                      align="right"
                      sortDirection={
                        accessorySort?.key === "quantity" ? accessorySort.direction : null
                      }
                      onSort={() =>
                        setAccessorySort((current) => nextSortState(current, "quantity"))
                      }
                    >
                      Quantity
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAccessories.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        {renderStatus(
                          item.present,
                          (present) =>
                            setField(
                              "accessories",
                              fields.accessories.map((row) =>
                                row.name === item.name ? { ...row, present } : row,
                              ),
                            ),
                          `${item.name} status`,
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.quantity !== undefined && (
                          <Input
                            className={`${input} text-right tabular-nums`}
                            aria-label={`${item.name} quantity`}
                            value={item.quantity}
                            onChange={(event) =>
                              setField(
                                "accessories",
                                fields.accessories.map((row) =>
                                  row.name === item.name
                                    ? { ...row, quantity: event.target.value }
                                    : row,
                                ),
                              )
                            }
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
          <section className="grid gap-5 rounded-md border p-4 sm:grid-cols-2">
            {renderFuel("FUEL IN", fields.fuelIn, (value) => setField("fuelIn", value))}
            {renderFuel("FUEL OUT", fields.fuelOut, (value) => setField("fuelOut", value))}
            {renderText("KMS/Miles IN", fields.kmsIn, (value) => setField("kmsIn", value))}
            {renderText("KMS/Miles OUT", fields.kmsOut, (value) => setField("kmsOut", value))}
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">DAMAGES</h3>
            <p className="text-sm text-muted-foreground">C = Chip, D = Dent, S = Scratch</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {fields.damages.map((damage, index) => (
                <div key={index} className="grid grid-cols-[1fr_110px] items-end gap-2">
                  <label className="field">
                    <span>Area {index + 1}</span>
                    <Input
                      value={damage.area}
                      onChange={(event) =>
                        setField(
                          "damages",
                          fields.damages.map((row, i) =>
                            i === index ? { ...row, area: event.target.value } : row,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="field">
                    <span>C / D / S</span>
                    <select
                      className="h-9 rounded-md border bg-background px-3 text-sm font-normal"
                      value={damage.type}
                      onChange={(event) =>
                        setField(
                          "damages",
                          fields.damages.map((row, i) =>
                            i === index ? { ...row, type: event.target.value } : row,
                          ),
                        )
                      }
                    >
                      <option value=""></option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="S">S</option>
                    </select>
                  </label>
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">JOB TO BE DONE</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {fields.jobToBeDone.map((line, index) => (
                <label className="registration-row-compact" key={index}>
                  <span className="registration-label">Line {index + 1}</span>
                  <Input
                    className="registration-input"
                    value={line}
                    onChange={(event) =>
                      setField(
                        "jobToBeDone",
                        fields.jobToBeDone.map((value, i) =>
                          i === index ? event.target.value : value,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setField("jobToBeDone", [...fields.jobToBeDone, ""])}
            >
              <Plus /> Add line
            </Button>
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">ADDITIONAL</h3>
            <div className="space-y-2">
              {fields.additional.map((item, index) => (
                <div key={index} className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
                  {renderText(`Item ${index + 1}`, item.name, (name) =>
                    setField(
                      "additional",
                      fields.additional.map((row, i) => (i === index ? { ...row, name } : row)),
                    ),
                  )}
                  {renderStatus(
                    item.present,
                    (present) =>
                      setField(
                        "additional",
                        fields.additional.map((row, i) =>
                          i === index ? { ...row, present } : row,
                        ),
                      ),
                    `Additional item ${index + 1} status`,
                  )}
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="font-semibold">Remarks</h3>
            {fields.remarks.map((remark, index) => (
              <label className="field" key={index}>
                <span>Line {index + 1}</span>
                <Input
                  value={remark}
                  onChange={(event) =>
                    setField(
                      "remarks",
                      fields.remarks.map((value, i) => (i === index ? event.target.value : value)),
                    )
                  }
                />
              </label>
            ))}
          </section>
          <section className="space-y-3 rounded-md border p-4">
            <h3 className="font-semibold">Customer&apos;s Conditions</h3>
            <h3 className="font-semibold">Service Management</h3>
          </section>
          <section className="registration-section-box">
            <div className="registration-section-title">Handover &amp; Collection</div>
            <div className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                {renderText("Delivered By", fields.deliveredBy, (value) =>
                  setField("deliveredBy", value),
                )}
                {renderText("Delivered Signature", fields.deliveredSignature, (value) =>
                  setField("deliveredSignature", value),
                )}
                {renderText("Delivered Tel", fields.deliveredTel, (value) =>
                  setField("deliveredTel", value),
                )}
                {renderText("Received & Checked By", fields.receivedCheckedBy, (value) =>
                  setField("receivedCheckedBy", value),
                )}
                {renderText("Collected By", fields.collectedBy, (value) =>
                  setField("collectedBy", value),
                )}
                {renderText("Collected Signature", fields.collectedSignature, (value) =>
                  setField("collectedSignature", value),
                )}
                {renderText("Collection Date", fields.collectedDate, (value) =>
                  setField("collectedDate", value),
                )}
                {renderText("Phone No", fields.collectedPhone, (value) =>
                  setField("collectedPhone", value),
                )}
                {renderText("Released By", fields.releasedBy, (value) =>
                  setField("releasedBy", value),
                )}
                {renderText("Time Out (Hrs)", fields.timeOut, (value) =>
                  setField("timeOut", value),
                )}
              </div>
            </div>
          </section>
          <div className="registration-actions-flush">
            <Button type="submit" className="registration-submit-btn">
              <Save /> Submit
            </Button>
            <Button
              type="button"
              variant="outline"
              className="registration-reset-btn"
              onClick={() => setFields(newPaperInventoryFields())}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              className="registration-reset-btn"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaperInventoryView({ fields }: { fields: PaperInventoryFields }) {
  return (
    <div className="space-y-4">
      <header className="text-center">
        <strong>Hirider 4x4 World</strong>
        <p>Kafue Road</p>
        <p>Cell +260 966 766 693</p>
        <p>Email mkessa@hotmail.com</p>
        <strong>VEHICLE INVENTORY</strong>
      </header>
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ["JOB No.", fields.jobNo],
          ["Registration No.", fields.registrationNo],
          ["Make", fields.make],
          ["Date", fields.date],
          ["Owned by", fields.ownedBy],
          ["Driver", fields.driver],
        ].map(([label, value]) => (
          <p key={label}>
            <strong>{label}</strong>: {value}
          </p>
        ))}
      </div>
      <h3 className="font-semibold">ACCESSORIES</h3>
      {fields.accessories.map((item) => (
        <p key={item.name}>
          {item.name}:{" "}
          {item.present === "Present" ? "✓ Present" : item.present === "Missing" ? "✗ Missing" : ""}
          {item.quantity ? ` · Quantity ${item.quantity}` : ""}
        </p>
      ))}
      <div className="grid gap-2 sm:grid-cols-2">
        <p>FUEL IN: {fields.fuelIn}</p>
        <p>FUEL OUT: {fields.fuelOut}</p>
        <p>KMS/Miles IN: {fields.kmsIn}</p>
        <p>KMS/Miles OUT: {fields.kmsOut}</p>
      </div>
      <h3 className="font-semibold">DAMAGES (C = Chip, D = Dent, S = Scratch)</h3>
      {fields.damages
        .filter((row) => row.area || row.type)
        .map((row, index) => (
          <p key={index}>
            {row.area} {row.type}
          </p>
        ))}
      <h3 className="font-semibold">JOB TO BE DONE</h3>
      {fields.jobToBeDone.filter(Boolean).map((line, index) => (
        <p key={index}>{line}</p>
      ))}
      <h3 className="font-semibold">ADDITIONAL</h3>
      {fields.additional.map((item, index) => (
        <p key={index}>
          {item.name} {item.present === "Present" ? "✓" : item.present === "Missing" ? "✗" : ""}
        </p>
      ))}
      <h3 className="font-semibold">Remarks</h3>
      {fields.remarks.map((line, index) => (
        <p key={index}>{line}</p>
      ))}
      <h3 className="font-semibold">Customer&apos;s Conditions</h3>
      <h3 className="font-semibold">Service Management</h3>
      <p>
        DELIVERED BY: {fields.deliveredBy} · Signature: {fields.deliveredSignature} · Tel:{" "}
        {fields.deliveredTel}
      </p>
      <p>RECEIVED &amp; CHECKED BY: {fields.receivedCheckedBy}</p>
      <p>
        COLLECTED BY: {fields.collectedBy} · Signature: {fields.collectedSignature} · Date:{" "}
        {fields.collectedDate} · Phone No: {fields.collectedPhone}
      </p>
      <p>
        Released by: {fields.releasedBy} · Time Out (Hrs): {fields.timeOut}
      </p>
    </div>
  );
}

function CreateRecord({
  kind,
  open,
  onClose,
}: {
  kind: RecordKind;
  open: boolean;
  onClose: () => void;
}) {
  const w = useWorkspace();
  const [vehicleId, setVehicleId] = useState("");
  const [catalogPartId, setCatalogPartId] = useState("");
  const [quotationLines, setQuotationLines] = useState<QuotationDraftLine[]>(initialQuotationLines);
  const [lineSort, setLineSort] = useState<SortState<QuotationItemSortKey>>(null);
  const [paperFields, setPaperFields] = useState<PaperQuotationFields>(initialPaperFields);
  const editedPaperFields = useRef(new Set<string>());
  const [jobDepartment, setJobDepartment] = useState<string>("Mechanical");
  const [jobDueDate, setJobDueDate] = useState<string>("");
  const [jobRemarks, setJobRemarks] = useState<string>("");
  const [jobPreparedByEmployeeId, setJobPreparedByEmployeeId] = useState<string>("");
  const [jobPhotos, setJobPhotos] = useState<
    Array<{ id: string; name: string; url: string; size?: number }>
  >([]);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const c = config[kind];
  useEffect(() => {
    if (!open || kind !== "quotations") return;
    let active = true;
    void Promise.resolve()
      .then(() => backendApi.getCompanySettings())
      .then((settings) => {
        const settingFields: Record<string, string> = {
          companyName: "companyName",
          address: "address",
          email: "email",
          phone: "phone",
          bankName: "bankName",
          accountNumber: "bankAccountNumber",
          vatNumber: "vatNumber",
        };
        if (active)
          setPaperFields((current) => {
            const next = { ...current };
            for (const [field, source] of Object.entries(settingFields) as [
              keyof PaperQuotationFields,
              string,
            ][]) {
              const value = settings[source];
              if (!editedPaperFields.current.has(field) && typeof value === "string" && value)
                next[field] = value;
            }
            return next;
          });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [kind, open]);
  useEffect(() => {
    if (open && kind === "quotations") {
      setQuotationLines(initialQuotationLines());
      setLineSort(null);
      setPaperFields(initialPaperFields());
      editedPaperFields.current = new Set();
      setVehicleId("");
    }
  }, [kind, open]);
  useEffect(() => {
    if (open && kind === "jobs") {
      setJobDepartment("Mechanical");
      setJobDueDate("");
      setJobRemarks("");
      setJobPhotos([]);
      setIsDraggingPhoto(false);
      setVehicleId("");
      const employees = Array.isArray(w.workflowOptions["employees"])
        ? (w.workflowOptions["employees"] as Record<string, unknown>[])
        : [];
      const configuredEmployee = Number(import.meta.env["VITE_EMPLOYEE_ID"]);
      if (configuredEmployee > 0 && employees.some((e) => Number(e["id"]) === configuredEmployee)) {
        setJobPreparedByEmployeeId(String(configuredEmployee));
      } else if (employees.length > 0) {
        setJobPreparedByEmployeeId(String(employees[0]["id"] ?? ""));
      } else {
        setJobPreparedByEmployeeId("foreman");
      }
    }
  }, [open, kind, w.workflowOptions]);

  const handlePhotoFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    fileArray.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (url) {
          setJobPhotos((prev) => [
            ...prev,
            {
              id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: file.name,
              url,
              size: file.size,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (id: string) => {
    setJobPhotos((prev) => prev.filter((p) => p.id !== id));
  };
  useEffect(() => {
    if (!open || kind !== "quotations") return;
    const employees = Array.isArray(w.workflowOptions["employees"])
      ? (w.workflowOptions["employees"] as Record<string, unknown>[])
      : [];
    const configuredEmployee = Number(import.meta.env["VITE_EMPLOYEE_ID"]);
    const name = String(
      employees.find((employee) => Number(employee["id"]) === configuredEmployee)?.["name"] ?? "",
    );
    if (!name) return;
    setPaperFields((current) => ({
      ...current,
      ...(editedPaperFields.current.has("salesperson") ? {} : { salesperson: name }),
      ...(editedPaperFields.current.has("preparedBy") ? {} : { preparedBy: name }),
    }));
  }, [kind, open, w.workflowOptions]);
  const eligible = w.vehicles.filter(
    (v) =>
      !v.released &&
      (kind === "inventory"
        ? w.quotations.some((q) => q.vehicleId === v.id && canCreateInventory(q.status)) &&
          !w.inventory.some((i) => i.vehicleId === v.id)
        : kind === "jobs"
          ? w.inventory.some((i) => i.vehicleId === v.id) ||
            w.quotations.some((q) => q.vehicleId === v.id && canCreateInventory(q.status)) ||
            v.stage >= 3
          : kind === "requisitions"
            ? w.jobs.some((j) => j.vehicleId === v.id) || v.stage >= 4
            : kind === "inspections"
              ? v.stage >= 5
              : true),
  );
  const quoteSubtotal = roundMoney(
    quotationLines.reduce(
      (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0),
      0,
    ),
  );
  const quoteTax = roundMoney(
    quotationLines.reduce((sum, line) => {
      const lineSubtotal = roundMoney((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0));
      return sum + roundMoney((lineSubtotal * QUOTATION_VAT_RATE) / 100);
    }, 0),
  );
  const quoteTotal = roundMoney(quoteSubtotal + quoteTax);
  const validQuotationLines = quotationLines.filter(
    (line) =>
      line.item.trim() &&
      line.description.trim() &&
      Number.isFinite(Number(line.quantity)) &&
      Number(line.quantity) > 0 &&
      Number.isFinite(Number(line.unitPrice)) &&
      Number(line.unitPrice) > 0,
  );
  const hasPartialLine = quotationLines.some(
    (line) =>
      (line.item.trim() || line.description.trim() || line.unitPrice.trim()) &&
      !validQuotationLines.includes(line),
  );
  const quoteMissingMessage = [
    !vehicleId ? "Select a registered vehicle." : "",
    validQuotationLines.length === 0
      ? "Add at least one valid line with an item, description, positive quantity and price."
      : "",
    hasPartialLine ? "Complete or remove each partially filled line." : "",
  ]
    .filter(Boolean)
    .join(" ");
  const updatePaperField = (field: string, value: string) => {
    editedPaperFields.current.add(field);
    setPaperFields((current) => ({ ...current, [field]: value }));
  };
  const fillFromVehicle = (field: string, value: string) => {
    if (!editedPaperFields.current.has(field))
      setPaperFields((current) => ({ ...current, [field]: value }));
  };
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = eligible.find((v) => v.id === vehicleId);
    if (!v) {
      toast.error("Select an eligible vehicle.");
      return;
    }
    const f = new FormData(e.currentTarget);
    const text = (name: string) => String(f.get(name) ?? "");
    if (kind === "requisitions" && !catalogPartId) {
      toast.error("Select a catalog part.");
      return;
    }
    let id = "";
    if (kind === "quotations") {
      if (hasPartialLine) {
        toast.error("Complete or remove each partially filled line.");
        return;
      }
      const normalizedLines = validQuotationLines.map((line) => ({
        ...line,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
      }));
      if (!normalizedLines.length) {
        toast.error("Add at least one quotation line item.");
        return;
      }
      if (
        !Number.isSafeInteger(Number(import.meta.env["VITE_EMPLOYEE_ID"])) ||
        Number(import.meta.env["VITE_EMPLOYEE_ID"]) <= 0
      ) {
        toast.error(
          "Set VITE_EMPLOYEE_ID to an active workshop employee before creating a quotation.",
        );
        return;
      }
      id = `NEW-${Date.now()}`;
      const items = normalizedLines.map((line) => ({
        itemType:
          line.item.trim().toLowerCase() === "labour" ? ("LABOUR" as const) : ("PART" as const),
        item: line.item.trim(),
        description: line.description.trim(),
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: roundMoney(line.quantity * line.unitPrice),
        taxAmount: roundMoney(
          (roundMoney(line.quantity * line.unitPrice) * QUOTATION_VAT_RATE) / 100,
        ),
      }));
      w.setQuotations((prev) => [
        {
          id,
          vehicleId,
          amount: quoteTotal,
          subtotal: quoteSubtotal,
          taxAmount: quoteTax,
          description: items.map((item) => item.description).join("; "),
          preparedByName: paperFields["preparedBy"],
          paperFields,
          items,
          status: "Draft",
        },
        ...prev,
      ]);
      w.updateVehicleStage(vehicleId, 1);
    }
    if (kind === "inventory") {
      id = `IC-${452 + w.inventory.length - 3}`;
      w.setInventory((prev) => [
        { id, vehicleId, items: text("items"), condition: text("condition"), date: "11 Nov 2026" },
        ...prev,
      ]);
      w.updateVehicleStage(vehicleId, 4);
    }
    if (kind === "jobs") {
      id = `JC-${882 + w.jobs.length - 5}`;
      const employees = Array.isArray(w.workflowOptions["employees"])
        ? (w.workflowOptions["employees"] as Record<string, unknown>[])
        : [];
      const selectedEmp = employees.find((emp) => String(emp["id"]) === jobPreparedByEmployeeId);
      const preparedByName = selectedEmp
        ? String(selectedEmp["name"] ?? "")
        : jobPreparedByEmployeeId === "foreman"
          ? w.foreman
          : undefined;
      const preparedByEmpId =
        selectedEmp && Number(selectedEmp["id"]) > 0
          ? Number(selectedEmp["id"])
          : Number(import.meta.env["VITE_EMPLOYEE_ID"]) || undefined;
      const newJobPhotos = jobPhotos.map((p) => p.url);
      const finalDepartment = jobDepartment || text("department") || "Mechanical";

      w.setJobs((prev) => [
        {
          id,
          vehicleId,
          department: finalDepartment,
          work: text("description"),
          status: "Pending",
          due: text("due") || jobDueDate || "To be confirmed",
          remarks: (text("remarks") || jobRemarks).trim() || undefined,
          preparedBy: preparedByName,
          preparedByEmployeeId: preparedByEmpId,
          photos: newJobPhotos.length > 0 ? newJobPhotos : undefined,
        },
        ...prev,
      ]);
      w.setVehicles((prev) =>
        prev.map((item) =>
          item.id === vehicleId
            ? {
                ...item,
                stage: Math.max(item.stage, 5),
                department: finalDepartment,
                ...(newJobPhotos.length > 0
                  ? { photos: [...(item.photos ?? []), ...newJobPhotos] }
                  : {}),
              }
            : item,
        ),
      );
    }
    if (kind === "requisitions") {
      id = `PR-${452 + w.requisitions.length - 6}`;
      w.setRequisitions((prev) => [
        {
          id,
          vehicleId,
          part: w.parts.find((part) => part.id === Number(catalogPartId))?.name ?? "",
          quantity: 1,
          department: "Workshop",
          reason: text("description"),
          amount: 0,
          foreman: w.foreman,
          status: "Pending",
          date: "11 Nov 2026",
        },
        ...prev,
      ]);
      w.updateVehicleStage(vehicleId, 6);
    }
    if (kind === "inspections") {
      id = `IN-${213 + w.inspections.length - 2}`;
      w.setInspections((prev) => [
        {
          id,
          vehicleId,
          foreman: w.foreman,
          date: "11 Nov 2026",
          result: "Rework required",
          notes: text("description"),
        },
        ...prev,
      ]);
      w.setVehicles((prev) =>
        prev.map((item) =>
          item.id === vehicleId
            ? {
                ...item,
                stage: 9,
                progress: 90,
              }
            : item,
        ),
      );
    }
    w.addActivity(
      `${c.singular.charAt(0).toUpperCase() + c.singular.slice(1)} ${kind === "requisitions" ? "submitted" : "created"}`,
      `${w.foreman} · ${id}`,
    );
    toast.success(
      kind === "requisitions" ? `${id} submitted for Director authorization.` : `${id} saved.`,
    );
    setVehicleId("");
    onClose();
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        className={
          kind === "quotations"
            ? "modal-scroll max-w-6xl sm:max-w-6xl"
            : kind === "jobs"
              ? "modal-scroll max-w-2xl sm:max-w-2xl"
              : "modal-scroll"
        }
      >
        <DialogHeader>
          <DialogTitle>New {c.singular}</DialogTitle>
          {kind !== "quotations" && (
            <DialogDescription>{w.foreman} · 11 November 2026</DialogDescription>
          )}
        </DialogHeader>
        {kind === "quotations" ? (
          <form onSubmit={submit} className="space-y-5">
            <div className="registration-section-box">
              <div className="registration-section-title">Company Header</div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                {(
                  [
                    ["companyName", "Company Name"],
                    ["address", "Address"],
                    ["email", "Email"],
                    ["phone", "Phone"],
                    ["bankName", "Bank Details"],
                    ["accountNumber", "Account Number"],
                    ["vatNumber", "VAT"],
                  ] as const
                ).map(([field, label]) => (
                  <div className="registration-row-compact registration-row-top" key={field}>
                    <label htmlFor={`quote-${field}`} className="registration-label">
                      {label}
                    </label>
                    <div className="space-y-1">
                      <Input
                        id={`quote-${field}`}
                        className="registration-input"
                        value={paperFields[field] ?? ""}
                        onChange={(event) => updatePaperField(field, event.target.value)}
                      />
                      <small className="block text-xs font-medium text-muted-foreground">
                        Kept in quotation print metadata.
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="registration-section-box">
              <div className="registration-section-title">Quote Details</div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                {(
                  [
                    ["date", "Date"],
                    ["quoteNo", "Quote No."],
                    ["salesperson", "Salesperson"],
                  ] as const
                ).map(([field, label]) => (
                  <div className="registration-row-compact registration-row-top" key={field}>
                    <label htmlFor={`quote-${field}`} className="registration-label">
                      {label}
                    </label>
                    <div className="space-y-1">
                      <Input
                        id={`quote-${field}`}
                        className="registration-input"
                        value={paperFields[field] ?? ""}
                        onChange={(event) => updatePaperField(field, event.target.value)}
                      />
                      {field === "quoteNo" && (
                        <small className="block text-xs font-medium text-muted-foreground">
                          Backend generates the saved quotation number; value kept for print.
                        </small>
                      )}
                      {field === "date" && (
                        <small className="block text-xs font-medium text-muted-foreground">
                          Retained in quotation print metadata.
                        </small>
                      )}
                      {field === "salesperson" && (
                        <small className="block text-xs font-medium text-muted-foreground">
                          Printed name retained in quotation metadata.
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="registration-section-box">
                <div className="registration-section-title">Bill To</div>
                <div className="space-y-4 p-5">
                  {(["billTo1", "billTo2"] as const).map((field, index) => (
                    <div className="registration-row-compact registration-row-top" key={field}>
                      <label htmlFor={`quote-${field}`} className="registration-label">
                        Line {index + 1}
                      </label>
                      <div className="space-y-1">
                        <Input
                          id={`quote-${field}`}
                          className="registration-input"
                          value={paperFields[field] ?? ""}
                          onChange={(event) => updatePaperField(field, event.target.value)}
                        />
                        <small className="block text-xs font-medium text-muted-foreground">
                          {index === 0
                            ? "Backend uses the linked customer; retained for print."
                            : "Retained for printing."}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="registration-section-box">
                <div className="registration-section-title">Ship To</div>
                <div className="space-y-4 p-5">
                  <div className="registration-row-compact">
                    <span className="registration-label">
                      Registered Vehicle <span className="registration-required">*</span>
                    </span>
                    <Select
                      value={vehicleId}
                      onValueChange={(nextId) => {
                        setVehicleId(nextId);
                        const selected = eligible.find((vehicle) => vehicle.id === nextId);
                        if (!selected) return;
                        fillFromVehicle("billTo1", selected.customer);
                        fillFromVehicle("shipTo1", selected.customer);
                        fillFromVehicle("shipTo2", selected.make);
                        fillFromVehicle("shipTo3", selected.plate);
                      }}
                    >
                      <SelectTrigger
                        aria-label="Registered vehicle"
                        className="registration-select-trigger"
                      >
                        <SelectValue placeholder="Select a registered vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligible.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} · {vehicle.plate} · {vehicle.customer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {w.vehicles.length === 0 ? (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      No vehicles loaded. Register a vehicle first.
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="registration-reset-btn"
                        onClick={() => void w.refresh()}
                      >
                        Retry
                      </Button>
                    </p>
                  ) : eligible.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No eligible registered vehicles are available.
                    </p>
                  ) : null}
                  {(
                    [
                      ["shipTo1", "Customer"],
                      ["shipTo2", "Make & Model"],
                      ["shipTo3", "Registration No."],
                    ] as const
                  ).map(([field, label]) => (
                    <div className="registration-row-compact" key={field}>
                      <label htmlFor={`quote-${field}`} className="registration-label">
                        {label}
                      </label>
                      <Input
                        id={`quote-${field}`}
                        className="registration-input"
                        value={paperFields[field] ?? ""}
                        onChange={(event) => updatePaperField(field, event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <section className="space-y-3">
              <h3 className="font-semibold">Line items</h3>
              <div className="overflow-x-auto rounded-md border">
                <Table className="min-w-[1040px] table-fixed">
                  <colgroup>
                    <col className="w-[88px]" />
                    <col className="w-[244px]" />
                    <col className="w-[334px]" />
                    <col className="w-[175px]" />
                    <col className="w-[175px]" />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        align="right"
                        sortDirection={lineSort?.key === "quantity" ? lineSort.direction : null}
                        onSort={() => setLineSort((current) => nextSortState(current, "quantity"))}
                      >
                        Qty
                      </TableHead>
                      <TableHead
                        sortDirection={lineSort?.key === "item" ? lineSort.direction : null}
                        onSort={() => setLineSort((current) => nextSortState(current, "item"))}
                      >
                        Item
                      </TableHead>
                      <TableHead
                        sortDirection={lineSort?.key === "description" ? lineSort.direction : null}
                        onSort={() =>
                          setLineSort((current) => nextSortState(current, "description"))
                        }
                      >
                        Description
                      </TableHead>
                      <TableHead
                        align="right"
                        sortDirection={lineSort?.key === "unitPrice" ? lineSort.direction : null}
                        onSort={() => setLineSort((current) => nextSortState(current, "unitPrice"))}
                      >
                        Unit Price
                      </TableHead>
                      <TableHead
                        align="right"
                        sortDirection={lineSort?.key === "total" ? lineSort.direction : null}
                        onSort={() => setLineSort((current) => nextSortState(current, "total"))}
                      >
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortRecords(quotationLines, lineSort, (entry, key) => {
                      switch (key) {
                        case "quantity":
                          return Number(entry.quantity) || 0;
                        case "item":
                          return entry.item;
                        case "description":
                          return entry.description;
                        case "unitPrice":
                          return Number(entry.unitPrice) || 0;
                        case "total":
                          return (Number(entry.quantity) || 0) * (Number(entry.unitPrice) || 0);
                      }
                    }).map((line, index) => (
                      <TableRow key={line.rowId}>
                        <TableCell className="text-right tabular-nums">
                          <Input
                            aria-label={`Line ${index + 1} quantity`}
                            className="text-right tabular-nums"
                            type="number"
                            step="0.01"
                            value={line.quantity}
                            onChange={(event) =>
                              setQuotationLines((lines) =>
                                lines.map((current) =>
                                  current.rowId === line.rowId
                                    ? { ...current, quantity: event.target.value }
                                    : current,
                                ),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Input
                              aria-label={`Line ${index + 1} item`}
                              maxLength={80}
                              value={line.item}
                              onChange={(event) =>
                                setQuotationLines((lines) =>
                                  lines.map((current) =>
                                    current.rowId === line.rowId
                                      ? { ...current, item: event.target.value }
                                      : current,
                                  ),
                                )
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove line ${index + 1}`}
                              onClick={() =>
                                setQuotationLines((lines) =>
                                  lines.filter((current) => current.rowId !== line.rowId),
                                )
                              }
                            >
                              <X />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            aria-label={`Line ${index + 1} description`}
                            maxLength={255}
                            value={line.description}
                            onChange={(event) =>
                              setQuotationLines((lines) =>
                                lines.map((current) =>
                                  current.rowId === line.rowId
                                    ? { ...current, description: event.target.value }
                                    : current,
                                ),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <div className="flex items-center gap-1">
                            <span>K</span>
                            <Input
                              className="min-w-0 flex-1 text-right tabular-nums"
                              aria-label={`Line ${index + 1} unit price in ZMW`}
                              type="number"
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(event) =>
                                setQuotationLines((lines) =>
                                  lines.map((current) =>
                                    current.rowId === line.rowId
                                      ? { ...current, unitPrice: event.target.value }
                                      : current,
                                  ),
                                )
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <Input
                            aria-label={`Line ${index + 1} total`}
                            className="text-right tabular-nums"
                            readOnly
                            value={money(
                              (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0),
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {quotationLines.length === 0 && (
                  <div className="empty-state-wrap">
                    <EmptyState
                      compact
                      icon={FileText}
                      title="No quotation line items"
                      description="Add parts, consumables, or labour entries to calculate the quotation subtotal and VAT."
                      action={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setQuotationLines((lines) => [...lines, emptyQuotationLine()])
                          }
                        >
                          <Plus /> Add line
                        </Button>
                      }
                    />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuotationLines((lines) => [...lines, emptyQuotationLine()])}
              >
                <Plus /> Add line
              </Button>
            </section>
            <div className="ml-auto grid max-w-sm grid-cols-2 gap-y-2 rounded-md border p-4 text-sm">
              <span>Subtotal</span>
              <Input aria-label="Subtotal" readOnly value={money(quoteSubtotal)} />
              <span>VAT (16%)</span>
              <Input aria-label="VAT" readOnly value={money(quoteTax)} />
              <strong>Total</strong>
              <Input aria-label="Total" readOnly value={money(quoteTotal)} />
            </div>
            <div className="registration-section-box p-5">
              <div className="grid gap-4 md:grid-cols-2">
                {(["preparedBy", "signature", "invoiceReference"] as const).map((field) => (
                  <div className="registration-row-compact" key={field}>
                    <label htmlFor={`quote-${field}`} className="registration-label">
                      {field === "preparedBy"
                        ? "Prepared By"
                        : field === "signature"
                          ? "Signature"
                          : "Invoice Reference"}
                    </label>
                    <Input
                      id={`quote-${field}`}
                      className="registration-input"
                      value={paperFields[field] ?? ""}
                      onChange={(event) => updatePaperField(field, event.target.value)}
                    />
                  </div>
                ))}
                <p className="self-center text-xs font-medium text-muted-foreground">
                  Thank you for your business.
                </p>
              </div>
            </div>
            {quoteMissingMessage && (
              <p className="text-sm text-muted-foreground">{quoteMissingMessage}</p>
            )}
            <div className="registration-actions-flush">
              <Button
                type="submit"
                disabled={!vehicleId || validQuotationLines.length === 0}
                className="registration-submit-btn"
              >
                <Save /> Submit
              </Button>
              <Button
                type="button"
                variant="outline"
                className="registration-reset-btn"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={submit}
            onReset={() => {
              setVehicleId("");
              setCatalogPartId("");
              setJobDepartment("Mechanical");
              setJobDueDate("");
              setJobRemarks("");
              setJobPhotos([]);
              if (photoInputRef.current) photoInputRef.current.value = "";
            }}
          >
            <div className="space-y-4 pt-2">
              <div className="registration-row-compact">
                <span className="registration-label">
                  Vehicle <span className="registration-required">*</span>
                </span>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger aria-label="Vehicle" className="registration-select-trigger">
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligible.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.make} · {v.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {eligible.length === 0 && (
                <p className="text-xs font-medium text-muted-foreground">
                  {kind === "inventory"
                    ? "No vehicles with customer-approved quotations are awaiting an inventory card."
                    : kind === "jobs"
                      ? "No vehicles with inventory cards are awaiting a job card."
                      : kind === "inspections"
                        ? "No vehicles are currently awaiting inspection."
                        : "No eligible vehicle records are available."}
                </p>
              )}
              {kind === "inventory" ? (
                <p className="text-xs font-medium text-muted-foreground">
                  Inventory cards are created automatically during vehicle intake.
                </p>
              ) : kind === "jobs" ? (
                <>
                  <div className="registration-row-compact">
                    <span className="registration-label">
                      Department <span className="registration-required">*</span>
                    </span>
                    <Select value={jobDepartment} onValueChange={setJobDepartment}>
                      <SelectTrigger
                        id="job-department-trigger"
                        aria-label="Department"
                        className="registration-select-trigger"
                      >
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="registration-row-compact">
                    <span className="registration-label">Prepared By</span>
                    <Select
                      value={jobPreparedByEmployeeId}
                      onValueChange={setJobPreparedByEmployeeId}
                    >
                      <SelectTrigger
                        id="job-prepared-by-trigger"
                        aria-label="Prepared By"
                        className="registration-select-trigger"
                      >
                        <SelectValue placeholder="Select employee / foreman" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Array.isArray(w.workflowOptions["employees"])
                          ? (w.workflowOptions["employees"] as Record<string, unknown>[])
                          : []
                        ).map((emp) => {
                          const empId = String(emp["id"] ?? "");
                          const empName = String(emp["name"] ?? `Employee #${empId}`);
                          const empRole = String(emp["designation"] ?? emp["role"] ?? "");
                          return (
                            <SelectItem key={empId} value={empId}>
                              {empName} {empRole ? `(${empRole})` : ""}
                            </SelectItem>
                          );
                        })}
                        <SelectItem value="foreman">{w.foreman} (Foreman)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="registration-row-compact">
                    <label htmlFor="job-due-date" className="registration-label">
                      Target Due Date
                    </label>
                    <Input
                      id="job-due-date"
                      name="due"
                      type="date"
                      value={jobDueDate}
                      onChange={(e) => setJobDueDate(e.target.value)}
                      className="registration-input"
                      aria-label="Target Due Date"
                    />
                  </div>

                  <div className="registration-row-compact registration-row-top">
                    <label htmlFor="record-desc" className="registration-label">
                      Work Instructions <span className="registration-required">*</span>
                    </label>
                    <Textarea
                      id="record-desc"
                      name="description"
                      required
                      rows={3}
                      placeholder="Enter detailed repair tasks and work instructions..."
                      className="registration-textarea"
                    />
                  </div>

                  <div className="registration-row-compact registration-row-top">
                    <label htmlFor="job-remarks" className="registration-label">
                      Foreman Remarks
                    </label>
                    <Textarea
                      id="job-remarks"
                      name="remarks"
                      value={jobRemarks}
                      onChange={(e) => setJobRemarks(e.target.value)}
                      rows={2}
                      placeholder="Special handling instructions, customer damage observations..."
                      className="registration-textarea"
                    />
                  </div>

                  <div className="registration-row-compact registration-row-top">
                    <span className="registration-label">Damage Photos</span>
                    <div className="space-y-2.5">
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingPhoto(true);
                        }}
                        onDragLeave={() => setIsDraggingPhoto(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingPhoto(false);
                          if (e.dataTransfer.files) handlePhotoFiles(e.dataTransfer.files);
                        }}
                        className={cn(
                          "job-photo-dropzone",
                          isDraggingPhoto && "job-photo-dropzone-active",
                        )}
                      >
                        <input
                          ref={photoInputRef}
                          id="job-photo-input"
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files) handlePhotoFiles(e.target.files);
                            e.target.value = "";
                          }}
                        />
                        <label
                          htmlFor="job-photo-input"
                          className="flex flex-col items-center justify-center p-4 cursor-pointer text-center w-full"
                        >
                          <Camera className="w-5 h-5 text-muted-foreground mb-1.5" />
                          <span className="text-xs font-semibold text-foreground">
                            Click to select damaged vehicle photos or drag &amp; drop
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5">
                            Supports PNG, JPG, WebP · Visual thumbnails displayed below
                          </span>
                        </label>
                      </div>

                      {jobPhotos.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                            <span className="font-medium text-foreground">
                              {jobPhotos.length} photo{jobPhotos.length > 1 ? "s" : ""} selected
                            </span>
                            <button
                              type="button"
                              onClick={() => setJobPhotos([])}
                              className="text-xs text-destructive hover:underline font-medium cursor-pointer"
                            >
                              Clear all
                            </button>
                          </div>
                          <div className="job-photo-thumbnails" data-testid="job-photo-thumbnails">
                            {jobPhotos.map((photo) => (
                              <div key={photo.id} className="job-photo-thumb group">
                                <img src={photo.url} alt={photo.name} />
                                <button
                                  type="button"
                                  aria-label={`Remove photo ${photo.name}`}
                                  title={`Remove ${photo.name}`}
                                  onClick={() => removePhoto(photo.id)}
                                  className="job-photo-thumb-remove"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                                <span className="job-photo-thumb-name" title={photo.name}>
                                  {photo.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {kind === "requisitions" && w.parts.length > 0 && (
                    <div className="registration-row-compact">
                      <span className="registration-label">
                        Catalog Part <span className="registration-required">*</span>
                      </span>
                      <Select value={catalogPartId} onValueChange={setCatalogPartId}>
                        <SelectTrigger className="registration-select-trigger">
                          <SelectValue placeholder="Select a catalog part" />
                        </SelectTrigger>
                        <SelectContent>
                          {w.parts.map((part) => (
                            <SelectItem key={part.id} value={String(part.id)}>
                              {part.code} · {part.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="registration-row-compact registration-row-top">
                    <label htmlFor="record-desc" className="registration-label">
                      {kind === "requisitions" ? "Reason for Parts" : "Inspection Notes"}{" "}
                      <span className="registration-required">*</span>
                    </label>
                    <Textarea
                      id="record-desc"
                      name="description"
                      required
                      rows={3}
                      className="registration-textarea"
                    />
                  </div>
                  {kind === "requisitions" && (
                    <p className="text-xs font-medium text-muted-foreground">
                      The backend creates requisition lines from linked job card parts and current
                      stock.
                    </p>
                  )}
                  {kind === "inspections" && (
                    <p className="text-xs font-medium text-muted-foreground">
                      Starting an inspection creates the backend checklist. Checklist outcomes are
                      recorded through the backend inspection workflow.
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="registration-actions-modal">
              <Button type="submit" disabled={!vehicleId} className="registration-submit-btn">
                <Save />
                Submit
              </Button>
              <Button type="reset" variant="outline" className="registration-reset-btn">
                Reset
              </Button>
              <Button
                type="button"
                variant="outline"
                className="registration-reset-btn"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PaperQuotationPreview({
  quotation,
  onPrint,
}: {
  quotation: Quotation;
  onPrint: () => void;
}) {
  const fields = {
    ...initialPaperFields(),
    ...(quotation.paperFields ?? {}),
  } as PaperQuotationFields;
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onPrint}>
          <Printer /> Print
        </Button>
      </div>
      <article className="space-y-5 rounded-md border bg-white p-6 text-foreground">
        <header className="border-b pb-4">
          <h2 className="text-lg font-semibold">{fields.companyName}</h2>
          <p>{fields.address}</p>
          <p>
            {fields.email} · {fields.phone}
          </p>
          <p>
            {fields.bankName} · {fields.accountNumber}
          </p>
          <p>VAT: {fields.vatNumber}</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <h3 className="text-lg font-semibold">Quote</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <span className="text-muted-foreground">Date</span>
              <p>{fields.date}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Quote No.</span>
              <p>{fields.quoteNo}</p>
              {fields.quoteNo !== quotation.id && (
                <small className="text-muted-foreground">Backend assigned: {quotation.id}</small>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Salesperson</span>
              <p>{fields.salesperson}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <section>
            <h3 className="font-semibold">Bill To</h3>
            <p>{fields.billTo1}</p>
            <p>{fields.billTo2}</p>
          </section>
          <section>
            <h3 className="font-semibold">Ship To</h3>
            <p>{fields.shipTo1}</p>
            <p>{fields.shipTo2}</p>
            <p>{fields.shipTo3}</p>
          </section>
        </div>
        <div className="overflow-x-auto">
          <QuotationItemsTable
            items={quotation.items ?? []}
            rowKeyPrefix={`${quotation.id}-paper`}
            className="min-w-[720px]"
          />
        </div>
        <div className="ml-auto grid max-w-xs grid-cols-2 gap-y-2 text-sm">
          <span>Subtotal</span>
          <span className="text-right">{money(quotation.subtotal ?? quotation.amount)}</span>
          <span>VAT (16%)</span>
          <span className="text-right">{money(quotation.taxAmount ?? 0)}</span>
          <strong>Total</strong>
          <strong className="text-right">{money(quotation.amount)}</strong>
        </div>
        <footer className="grid gap-5 border-t pt-4 sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Prepared By</span>
            <p>{fields.preparedBy}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Signature</span>
            <p>{fields.signature}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Invoice reference</span>
            <p>{fields.invoiceReference}</p>
          </div>
          <p className="self-end text-sm">Thank you for your business.</p>
        </footer>
      </article>
    </div>
  );
}

function InspectionDetail({
  inspection,
  onClose,
}: {
  inspection: Inspection | null;
  onClose: () => void;
}) {
  const w = useWorkspace();
  const [statuses, setStatuses] = useState<Record<number, "PASS" | "FAIL">>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [departments, setDepartments] = useState<Record<number, string>>({});
  const id = inspection?.backendId;
  const stored = id ? w.inspectionDetails.get(id) : undefined;
  const details = stored?.["details"] as Record<string, unknown> | undefined;
  const signoffData = stored?.["signoffs"] as Record<string, unknown> | undefined;
  const checklist = Array.isArray(details?.["checklist"])
    ? (details["checklist"] as Record<string, unknown>[])
    : [];
  const signoffs = Array.isArray(signoffData?.["signoffs"])
    ? (signoffData["signoffs"] as Record<string, unknown>[])
    : [];
  const options = (w.workflowOptions["departments"] ?? []) as Record<string, unknown>[];
  const run = (action: () => Promise<unknown>, message: string) =>
    void action()
      .then(async () => {
        await w.refresh();
        toast.success(message);
      })
      .catch((error: Error) => toast.error(error.message));
  return (
    <Dialog
      open={!!inspection}
      onOpenChange={(open) => {
        if (!open) {
          setStatuses({});
          setComments({});
          setDepartments({});
          onClose();
        }
      }}
    >
      <DialogContent className="modal-scroll max-w-4xl">
        <DialogHeader>
          <DialogTitle>Final inspection · {inspection?.id}</DialogTitle>
          <DialogDescription>
            {w.vehicleFor(inspection?.vehicleId ?? "")?.plate} ·{" "}
            {String(details?.["inspectionStatus"] ?? inspection?.result ?? "")} ·{" "}
            {String(details?.["inspectionDecision"] ?? "Decision pending")}
          </DialogDescription>
        </DialogHeader>
        {!details ? (
          <Button variant="outline" onClick={() => void w.refresh()}>
            Load checklist
          </Button>
        ) : (
          <>
            <div className="max-h-[45vh] space-y-3 overflow-auto">
              {checklist.map((item) => {
                const itemId = Number(item["id"]);
                const saved = String(item["checkStatus"] ?? "PENDING");
                const status =
                  statuses[itemId] ?? (saved === "PASS" || saved === "FAIL" ? saved : undefined);
                return (
                  <div key={itemId} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong>
                          {String(item["itemCode"])} · {String(item["itemName"])}
                        </strong>
                        <p className="text-xs font-medium text-muted-foreground">
                          {String(item["inspectionCategory"])} · {saved}
                        </p>
                      </div>
                      <Select
                        value={status ?? ""}
                        onValueChange={(value: "PASS" | "FAIL") =>
                          setStatuses((prev) => ({ ...prev, [itemId]: value }))
                        }
                      >
                        <SelectTrigger className="registration-select-trigger w-36">
                          <SelectValue placeholder="Set result" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PASS">Pass</SelectItem>
                          <SelectItem value="FAIL">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Input
                        className="registration-input"
                        placeholder="Comments"
                        value={comments[itemId] ?? String(item["comments"] ?? "")}
                        onChange={(e) =>
                          setComments((prev) => ({ ...prev, [itemId]: e.target.value }))
                        }
                      />
                      {status === "FAIL" && (
                        <Select
                          value={
                            departments[itemId] ?? String(item["responsibleDepartmentId"] ?? "")
                          }
                          onValueChange={(value) =>
                            setDepartments((prev) => ({ ...prev, [itemId]: value }))
                          }
                        >
                          <SelectTrigger className="registration-select-trigger w-52">
                            <SelectValue placeholder="Responsible department" />
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((d) => (
                              <SelectItem key={String(d["id"])} value={String(d["id"])}>
                                {String(d["name"])}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {status && (
                        <Button
                          size="sm"
                          onClick={() => {
                            const dept =
                              departments[itemId] ?? String(item["responsibleDepartmentId"] ?? "");
                            if (status === "FAIL" && !dept) {
                              toast.error("Select the responsible department for a failed item.");
                              return;
                            }
                            run(
                              () =>
                                w.api.updateInspectionItem(
                                  id!,
                                  itemId,
                                  status,
                                  comments[itemId] ?? String(item["comments"] ?? ""),
                                  dept ? Number(dept) : undefined,
                                ),
                              "Inspection item updated.",
                            );
                          }}
                        >
                          Save
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <h3 className="font-semibold">Department sign-offs</h3>
            <div className="space-y-2">
              {signoffs.map((item) => {
                const departmentId = Number(item["departmentId"]);
                return (
                  <div
                    className="flex items-center justify-between gap-2 rounded border p-2"
                    key={departmentId}
                  >
                    <span>
                      {String(item["departmentName"])} · {String(item["signoffStatus"])}
                    </span>
                    {String(item["signoffStatus"]) === "PENDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          run(
                            () =>
                              w.api.signoffInspectionDepartment(
                                id!,
                                departmentId,
                                "Final inspection department sign-off",
                              ),
                            "Department sign-off recorded.",
                          )
                        }
                      >
                        Sign off
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  run(
                    () => w.api.createCorrectiveWorkOrders(id!),
                    "Corrective work orders generated.",
                  )
                }
              >
                Generate corrective work orders
              </Button>
              <Button
                onClick={() =>
                  run(() => w.api.completeInspection(id!), "Final inspection completed.")
                }
              >
                Complete inspection
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function RequestDetail({
  request,
  onClose,
  allowDecision,
}: {
  request: Requisition | null;
  onClose: () => void;
  allowDecision: boolean;
}) {
  const w = useWorkspace();
  const [rejection, setRejection] = useState(false);
  const [note, setNote] = useState("");
  const current = w.requisitions.find((r) => r.id === request?.id);
  function decide(status: "Approved" | "Rejected") {
    if (!current || !canDecideParts(w.role)) return;
    if (status === "Rejected" && !note.trim()) {
      toast.error("Please record the reason for rejection.");
      return;
    }
    toast.error(
      `The backend does not provide a requisition ${status.toLowerCase()} endpoint. No decision was saved.`,
    );
  }
  return (
    <Dialog
      open={!!current}
      onOpenChange={(o) => {
        if (!o) {
          setRejection(false);
          setNote("");
          onClose();
        }
      }}
    >
      <DialogContent className="modal-scroll">
        <DialogHeader>
          <DialogTitle>Parts request · {current?.id}</DialogTitle>
          <DialogDescription>Submitted {current?.date}</DialogDescription>
        </DialogHeader>
        {current && (
          <>
            <VehicleCell vehicle={w.vehicleFor(current.vehicleId)} />
            <dl className="detail-grid">
              <div>
                <dt>Part / item</dt>
                <dd>{current.part}</dd>
              </div>
              <div>
                <dt>Requested quantity</dt>
                <dd>{current.quantity}</dd>
              </div>
            </dl>
            <div className="detail-notes">
              <strong>Reason for requesting parts</strong>
              <p className="mt-2">{current.reason}</p>
            </div>
            <Status>{current.status}</Status>
            {current.decisionNote && (
              <p className="text-xs font-medium text-muted-foreground">
                Director note: {current.decisionNote}
              </p>
            )}
            {allowDecision && current.status === "Pending" && canDecideParts(w.role) && (
              <>
                {rejection && (
                  <div className="registration-row-compact registration-row-top">
                    <label htmlFor="req-reject-note" className="registration-label">
                      Rejection Reason <span className="registration-required">*</span>
                    </label>
                    <Textarea
                      id="req-reject-note"
                      className="registration-textarea"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Explain why this request is being rejected"
                    />
                  </div>
                )}
                <div className="registration-actions-flush">
                  <Button onClick={() => decide("Approved")} className="registration-submit-btn">
                    <Check />
                    Approve request
                  </Button>
                  <Button
                    variant="outline"
                    className="registration-reset-btn"
                    onClick={() => (rejection ? decide("Rejected") : setRejection(true))}
                  >
                    {rejection ? "Confirm rejection" : "Reject request"}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
