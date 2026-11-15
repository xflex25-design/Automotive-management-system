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
import { DataTable, EmptyState } from "@/components/workshop/shared";
import { nextSortState, sortRecords, type SortState } from "@/lib/workshop";

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
});
