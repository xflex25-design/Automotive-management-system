import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, EmptyState, Status, ToolbarSearch } from "@/components/workshop/shared";
import {
  filterVehicles,
  getVehicleStatusCategory,
  nextSortState,
  sortRecords,
  vehicleRegistrationStatuses,
  type SortState,
  type Vehicle,
  type VehicleRegistrationStatusFilter,
} from "@/lib/workshop";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function SortableTestTable({
  loading = false,
  rows = [
    { id: "VR-1002", customer: "Sarah Dlamini", amount: 1200 },
    { id: "VR-1001", customer: "John Musaku", amount: 450 },
  ],
}: {
  loading?: boolean;
  rows?: Array<{ id: string; customer: string; amount: number }>;
}) {
  const [sort, setSort] = useState<SortState<"id" | "customer" | "amount">>(null);
  const sorted = sortRecords(rows, sort, (row, key) => row[key]);

  return (
    <DataTable<"id" | "customer" | "amount">
      headers={[
        { label: "Record", sortKey: "id" },
        { label: "Customer", sortKey: "customer" },
        { label: "Amount", sortKey: "amount", align: "right" },
        "Actions",
      ]}
      loading={loading}
      loadingRows={4}
      sort={sort}
      onSort={(key) => setSort((current) => nextSortState(current, key))}
      empty={sorted.length === 0}
      emptyState={<EmptyState title="No records" description="Nothing found." />}
    >
      {sorted.map((row) => (
        <tr key={row.id}>
          <td>{row.id}</td>
          <td>{row.customer}</td>
          <td className="text-right tabular-nums">{row.amount}</td>
          <td>View</td>
        </tr>
      ))}
    </DataTable>
  );
}

function ShadcnSortableTable() {
  const rows = [
    { item: "Brake pads", qty: 4 },
    { item: "Air filter", qty: 1 },
  ];
  const [sort, setSort] = useState<SortState<"item" | "qty">>(null);
  const sorted = sortRecords(rows, sort, (row, key) => row[key]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            sortDirection={sort?.key === "item" ? sort.direction : null}
            onSort={() => setSort((current) => nextSortState(current, "item"))}
          >
            Item
          </TableHead>
          <TableHead
            align="right"
            sortDirection={sort?.key === "qty" ? sort.direction : null}
            onSort={() => setSort((current) => nextSortState(current, "qty"))}
          >
            Qty
          </TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.item}>
            <TableCell>{row.item}</TableCell>
            <TableCell className="text-right tabular-nums">{row.qty}</TableCell>
            <TableCell>OK</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

describe("DataTable loading skeleton and sorting headers", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    container?.remove();
    container = null;
  });

  function mount(node: React.ReactElement) {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root?.render(node);
    });
    return container;
  }

  it("renders skeleton rows matching column count and hides empty state while loading", () => {
    const el = mount(<SortableTestTable loading rows={[]} />);
    const tableWrap = el.querySelector(".table-wrap");
    expect(tableWrap?.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelectorAll("tbody tr.table-skeleton-row")).toHaveLength(4);
    expect(el.querySelectorAll("tbody tr:first-child td")).toHaveLength(4);
    expect(el.textContent).not.toContain("No records");
    expect(el.querySelector('[role="status"]')?.textContent).toContain("Loading table records...");
  });

  it("renders empty state once loading finishes with zero rows", () => {
    const el = mount(<SortableTestTable loading={false} rows={[]} />);
    expect(el.querySelectorAll("tbody tr.table-skeleton-row")).toHaveLength(0);
    expect(el.textContent).toContain("No records");
  });

  it("toggles aria-sort, visual up/down arrows, accessible labels, and row order on DataTable", () => {
    const el = mount(<SortableTestTable />);
    const headers = el.querySelectorAll("thead th");
    const recordHeader = headers[0];
    const customerHeader = headers[1];
    const amountHeader = headers[2];
    const actionsHeader = headers[3];

    expect(recordHeader?.getAttribute("scope")).toBe("col");
    expect(recordHeader?.getAttribute("aria-sort")).toBe("none");
    expect(customerHeader?.getAttribute("aria-sort")).toBe("none");
    expect(amountHeader?.getAttribute("aria-sort")).toBe("none");
    expect(actionsHeader?.getAttribute("scope")).toBe("col");
    expect(actionsHeader?.hasAttribute("aria-sort")).toBe(false);
    expect(actionsHeader?.querySelector("button")).toBeNull();

    const recordBtn = recordHeader?.querySelector("button");
    const amountBtn = amountHeader?.querySelector("button");
    const recordIndicator = recordHeader?.querySelector(".table-sort-indicator");
    expect(recordBtn?.getAttribute("aria-label")).toContain("currently unsorted");
    expect(recordIndicator?.getAttribute("data-sort-direction")).toBe("none");
    expect(amountHeader?.classList.contains("text-right")).toBe(true);
    expect(amountBtn?.classList.contains("table-sort-btn-right")).toBe(true);

    act(() => {
      recordBtn?.click();
    });
    expect(recordHeader?.getAttribute("aria-sort")).toBe("ascending");
    expect(recordBtn?.getAttribute("aria-label")).toContain("currently sorted ascending");
    expect(recordIndicator?.getAttribute("data-sort-direction")).toBe("asc");
    expect(
      recordHeader?.querySelector(".table-sort-arrow-up")?.classList.contains("is-active"),
    ).toBe(true);
    expect(
      recordHeader?.querySelector(".table-sort-arrow-down")?.classList.contains("is-active"),
    ).toBe(false);
    expect(
      Array.from(el.querySelectorAll("tbody tr td:first-child")).map((td) => td.textContent),
    ).toEqual(["VR-1001", "VR-1002"]);

    act(() => {
      recordBtn?.click();
    });
    expect(recordHeader?.getAttribute("aria-sort")).toBe("descending");
    expect(recordBtn?.getAttribute("aria-label")).toContain("currently sorted descending");
    expect(recordIndicator?.getAttribute("data-sort-direction")).toBe("desc");
    expect(
      recordHeader?.querySelector(".table-sort-arrow-up")?.classList.contains("is-active"),
    ).toBe(false);
    expect(
      recordHeader?.querySelector(".table-sort-arrow-down")?.classList.contains("is-active"),
    ).toBe(true);
    expect(
      Array.from(el.querySelectorAll("tbody tr td:first-child")).map((td) => td.textContent),
    ).toEqual(["VR-1002", "VR-1001"]);

    act(() => {
      recordBtn?.click();
    });
    expect(recordHeader?.getAttribute("aria-sort")).toBe("none");
    expect(recordIndicator?.getAttribute("data-sort-direction")).toBe("none");
  });

  it("renders standardized sortable headers with tabular-nums alignment in Shadcn Table", () => {
    const el = mount(<ShadcnSortableTable />);
    const headers = el.querySelectorAll("thead th");
    const itemHeader = headers[0];
    const qtyHeader = headers[1];
    const notesHeader = headers[2];

    expect(el.querySelector("table")?.classList.contains("tabular-nums")).toBe(true);
    expect(itemHeader?.getAttribute("aria-sort")).toBe("none");
    expect(qtyHeader?.getAttribute("aria-sort")).toBe("none");
    expect(qtyHeader?.classList.contains("text-right")).toBe(true);
    expect(qtyHeader?.classList.contains("tabular-nums")).toBe(true);
    expect(qtyHeader?.querySelector("button")?.classList.contains("table-sort-btn-right")).toBe(
      true,
    );
    expect(notesHeader?.hasAttribute("aria-sort")).toBe(false);

    const qtyBtn = qtyHeader?.querySelector("button");
    act(() => {
      qtyBtn?.click();
    });
    expect(qtyHeader?.getAttribute("aria-sort")).toBe("ascending");
    expect(
      qtyHeader?.querySelector(".table-sort-indicator")?.getAttribute("data-sort-direction"),
    ).toBe("asc");
    expect(
      Array.from(el.querySelectorAll("tbody tr td:first-child")).map((td) => td.textContent),
    ).toEqual(["Air filter", "Brake pads"]);
  });

  it("renders illustrative EmptyState with iconography and triggers CTA callback", () => {
    let clicked = false;
    const el = mount(
      <EmptyState
        title="No vehicles registered yet"
        description="Register an incoming vehicle to begin tracking."
        actionLabel="Register vehicle"
        onAction={() => {
          clicked = true;
        }}
      />,
    );

    expect(el.querySelector("[data-empty-state='true']")).not.toBeNull();
    expect(el.querySelector(".empty-state-illustration")).not.toBeNull();
    expect(el.querySelector(".empty-state-icon svg")).not.toBeNull();
    expect(el.textContent).toContain("No vehicles registered yet");
    expect(el.textContent).toContain("Register an incoming vehicle to begin tracking.");

    const cta = el.querySelector("button");
    expect(cta?.textContent).toContain("Register vehicle");
    act(() => {
      cta?.click();
    });
    expect(clicked).toBe(true);
  });

  it("renders damaged vehicle photo thumbnails and allows removal", () => {
    function JobPhotoTest() {
      const [photos, setPhotos] = useState([
        { id: "p1", name: "front-bumper-dent.jpg", url: "data:image/jpeg;base64,123" },
        { id: "p2", name: "cracked-headlight.png", url: "data:image/png;base64,456" },
      ]);
      return (
        <div>
          <input
            id="job-photo-input"
            type="file"
            accept="image/*"
            multiple
            aria-label="Upload damaged vehicle photos"
          />
          <div className="job-photo-thumbnails" data-testid="job-photo-thumbnails">
            {photos.map((p) => (
              <div key={p.id} className="job-photo-thumb" data-testid={`thumb-${p.id}`}>
                <img src={p.url} alt={p.name} />
                <button
                  type="button"
                  aria-label={`Remove photo ${p.name}`}
                  onClick={() => setPhotos((prev) => prev.filter((item) => item.id !== p.id))}
                  className="job-photo-thumb-remove"
                >
                  X
                </button>
                <span className="job-photo-thumb-name">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const el = mount(<JobPhotoTest />);
    const thumbs = el.querySelectorAll(".job-photo-thumb");
    expect(thumbs.length).toBe(2);
    expect(thumbs[0]?.querySelector("img")?.getAttribute("src")).toBe("data:image/jpeg;base64,123");
    expect(thumbs[0]?.querySelector("img")?.getAttribute("alt")).toBe("front-bumper-dent.jpg");
    expect(thumbs[1]?.querySelector(".job-photo-thumb-name")?.textContent).toBe(
      "cracked-headlight.png",
    );

    const removeBtn = el.querySelector(
      'button[aria-label="Remove photo cracked-headlight.png"]',
    ) as HTMLButtonElement | null;
    expect(removeBtn).not.toBeNull();
    act(() => {
      removeBtn?.click();
    });

    const updatedThumbs = el.querySelectorAll(".job-photo-thumb");
    expect(updatedThumbs.length).toBe(1);
    expect(el.querySelector('button[aria-label="Remove photo cracked-headlight.png"]')).toBeNull();
  });

  it("filters vehicle registration table rows in real time by VIN, license plate, or owner name", () => {
    const sample: Vehicle[] = [
      {
        id: "VR-1068",
        plate: "BCA 4821",
        make: "Toyota Hilux",
        customer: "John Mwansa",
        phone: "+260977000111",
        email: "john@example.com",
        received: "11 Nov 2026",
        stage: 0,
        department: "Unassigned",
        foreman: "Foreman 01",
        complaints: "Brake squeal",
        damage: "None",
        due: "",
        progress: 0,
        vin: "1HGBH41JXMN109186",
      },
      {
        id: "VR-1067",
        plate: "BAZ 7390",
        make: "Ford Ranger",
        customer: "Sarah Banda",
        phone: "+260977000222",
        email: "sarah@example.com",
        received: "11 Nov 2026",
        stage: 0,
        department: "Unassigned",
        foreman: "Foreman 01",
        complaints: "Suspension check",
        damage: "Scuff",
        due: "",
        progress: 0,
        vin: "2T1BURHE0JC073215",
      },
    ];

    function VehicleSearchableTable() {
      const [query, setQuery] = useState("");
      const visible = filterVehicles(sample, { query });
      return (
        <div>
          <ToolbarSearch
            ariaLabel="Search registered vehicles by VIN, license plate, or owner name"
            placeholder="Search by VIN, license plate, or owner name..."
            value={query}
            onChange={setQuery}
          />
          <DataTable
            headers={["Vehicle", "VIN", "License plate", "Owner"]}
            empty={visible.length === 0}
            emptyState={
              <EmptyState title="No matching vehicles" description="Try another query." />
            }
          >
            {visible.map((v) => (
              <tr key={v.id}>
                <td>{v.make}</td>
                <td>{v.vin ?? "—"}</td>
                <td>{v.plate}</td>
                <td>{v.customer}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      );
    }

    const el = mount(<VehicleSearchableTable />);
    expect(el.querySelectorAll("tbody tr")).toHaveLength(2);

    const input = el.querySelector(
      'input[aria-label="Search registered vehicles by VIN, license plate, or owner name"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();

    const setInputValue = (value: string) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      act(() => {
        nativeSetter?.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    };

    // Filter by VIN
    setInputValue("109186");
    expect(el.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(el.textContent).toContain("BCA 4821");
    expect(el.textContent).not.toContain("BAZ 7390");

    // Filter by license plate
    setInputValue("baz 7390");
    expect(el.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(el.textContent).toContain("Sarah Banda");
    expect(el.textContent).not.toContain("John Mwansa");

    // Filter by owner name
    setInputValue("John");
    expect(el.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(el.textContent).toContain("1HGBH41JXMN109186");

    // No matches shows empty state, clear restores all
    setInputValue("NOMATCH999");
    expect(el.querySelectorAll("tbody tr")).toHaveLength(0);
    expect(el.textContent).toContain("No matching vehicles");

    const clearBtn = el.querySelector('button[aria-label="Clear filter"]') as HTMLButtonElement;
    act(() => {
      clearBtn.click();
    });
    expect(el.querySelectorAll("tbody tr")).toHaveLength(2);
  });

  it("filters vehicle registration rows by status dropdown and selects vehicles inside a Dialog", () => {
    if (!HTMLElement.prototype.hasPointerCapture) {
      HTMLElement.prototype.hasPointerCapture = () => false;
    }
    if (!HTMLElement.prototype.releasePointerCapture) {
      HTMLElement.prototype.releasePointerCapture = () => undefined;
    }
    if (!HTMLElement.prototype.scrollIntoView) {
      HTMLElement.prototype.scrollIntoView = () => undefined;
    }

    const vehicles: Vehicle[] = [
      {
        id: "VR-1",
        plate: "ACT 100",
        make: "Toyota Hilux",
        customer: "Alice Mbewe",
        phone: "+260977000111",
        email: "",
        received: "11 Nov 2026",
        stage: 1,
        department: "Unassigned",
        foreman: "Foreman 01",
        complaints: "Checkup",
        damage: "None",
        due: "",
        progress: 10,
      },
      {
        id: "VR-2",
        plate: "REP 200",
        make: "Ford Ranger",
        customer: "Bob Tembo",
        phone: "+260977000222",
        email: "",
        received: "11 Nov 2026",
        stage: 6,
        department: "Mechanical",
        foreman: "Foreman 01",
        complaints: "Brakes",
        damage: "Dent",
        due: "",
        progress: 50,
      },
      {
        id: "VR-3",
        plate: "DEL 300",
        make: "Isuzu D-Max",
        customer: "Carol Zulu",
        phone: "+260977000333",
        email: "",
        received: "11 Nov 2026",
        stage: 11,
        department: "Fitting",
        foreman: "Foreman 01",
        complaints: "Service",
        damage: "None",
        due: "",
        progress: 100,
        released: true,
      },
    ];

    function StatusFilterAndDialogSelectHarness() {
      const [statusFilter, setStatusFilter] = useState<VehicleRegistrationStatusFilter>("All");
      const [dialogOpen, setDialogOpen] = useState(false);
      const [selectedVehicleId, setSelectedVehicleId] = useState("");
      const visible = filterVehicles(vehicles, { status: statusFilter });

      return (
        <div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as VehicleRegistrationStatusFilter)}
          >
            <SelectTrigger aria-label="Filter vehicle status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {vehicleRegistrationStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "All" ? "All statuses" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button type="button" onClick={() => setDialogOpen(true)}>
            Open dialog
          </button>
          <DataTable headers={["Plate", "Status"]} empty={visible.length === 0}>
            {visible.map((v) => (
              <tr key={v.id}>
                <td>{v.plate}</td>
                <td>
                  <Status>{getVehicleStatusCategory(v)}</Status>
                </td>
              </tr>
            ))}
          </DataTable>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New job card</DialogTitle>
                <DialogDescription>Select vehicle test</DialogDescription>
              </DialogHeader>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger aria-label="Vehicle">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.make} · {v.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div data-testid="selected-vehicle-id">{selectedVehicleId}</div>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    const openRadixSelect = (trigger: HTMLElement) => {
      act(() => {
        trigger.focus();
        trigger.dispatchEvent(
          new MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0 }),
        );
        trigger.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
        );
      });
    };

    const el = mount(<StatusFilterAndDialogSelectHarness />);
    expect(el.querySelectorAll("tbody tr")).toHaveLength(3);

    const statusTrigger = el.querySelector(
      'button[aria-label="Filter vehicle status"]',
    ) as HTMLButtonElement;
    openRadixSelect(statusTrigger);

    const deliveredOpt = Array.from(document.body.querySelectorAll('[role="option"]')).find((opt) =>
      opt.textContent?.includes("Delivered"),
    ) as HTMLElement | undefined;
    expect(deliveredOpt).toBeDefined();
    act(() => {
      deliveredOpt?.click();
    });

    expect(el.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(el.textContent).toContain("DEL 300");
    expect(el.textContent).not.toContain("ACT 100");

    const openDialogBtn = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Open dialog"),
    ) as HTMLButtonElement;
    act(() => {
      openDialogBtn.click();
    });

    const dialogVehicleTrigger = document.body.querySelector(
      'button[aria-label="Vehicle"]',
    ) as HTMLButtonElement;
    expect(dialogVehicleTrigger).not.toBeNull();
    openRadixSelect(dialogVehicleTrigger);

    const vehicleOption = Array.from(document.body.querySelectorAll('[role="option"]')).find(
      (opt) => opt.textContent?.includes("REP 200"),
    ) as HTMLElement | undefined;
    expect(vehicleOption).toBeDefined();
    act(() => {
      vehicleOption?.click();
    });

    expect(document.body.querySelector('[data-testid="selected-vehicle-id"]')?.textContent).toBe(
      "VR-2",
    );
    expect(dialogVehicleTrigger.textContent).toContain("Ford Ranger · REP 200");
  });
});
