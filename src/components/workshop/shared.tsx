import { isValidElement, type ReactNode } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Car,
  Check,
  Download,
  FileText,
  Wrench,
  Package,
  ClipboardCheck,
  Clock,
  CalendarDays,
  Search,
  X,
  type FaIconType,
} from "./fa-icons";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SortIndicator, getAriaSort, getSortButtonAriaLabel } from "@/components/ui/table";
import {
  workflowStages,
  stageOwners,
  formatCompactNumber,
  type SortState,
  type Vehicle,
} from "@/lib/workshop";

export function PageHeading({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <>
      <div className="breadcrumb">
        <span>Workspace</span>
        <ChevronRight size={12} />
        <span>{title}</span>
      </div>
      <div className="page-heading">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="heading-actions">{children}</div>
      </div>
    </>
  );
}
export function SectionHeading({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
export function Status({ children: value }: { children: string | undefined }) {
  const children = value ?? "Intake";
  const normalized = children.toLowerCase();
  const isApproved = [
    "approved",
    "complete",
    "completed",
    "delivered",
    "passed",
    "released",
    "confirmed",
  ].includes(normalized);
  const isFlagged = ["flagged", "rejected", "rework required", "cancelled", "on hold"].includes(
    normalized,
  );
  const isPending = [
    "pending",
    "awaiting approval",
    "awaiting parts",
    "draft",
    "customer authorization",
  ].includes(normalized);

  let badgeColor = "status-blue";
  if (isApproved) badgeColor = "status-approved";
  else if (isFlagged) badgeColor = "status-flagged";
  else if (isPending) badgeColor = "status-pending";

  return (
    <span className={`status ${badgeColor}`}>
      {isApproved && <Check size={11} />}
      {children}
    </span>
  );
}

export function Metrics({
  items,
}: {
  items: {
    label: string;
    value: string | number;
    note?: string;
    hint?: string;
    icon: FaIconType;
    tone?: "default" | "success" | "warning" | "danger";
    delta?: { text: string; direction: "up" | "down" | "flat" };
  }[];
}) {
  return (
    <div className="metric-grid">
      {items.map((item) => {
        const displayValue =
          typeof item.value === "number" ? formatCompactNumber(item.value) : item.value;
        const iconToneClass =
          item.tone === "success"
            ? "metric-icon-success"
            : item.tone === "warning"
              ? "metric-icon-warning"
              : item.tone === "danger"
                ? "metric-icon-danger"
                : "";
        return (
          <div className="metric-card" key={item.label}>
            <div className={`metric-icon ${iconToneClass}`.trim()}>
              <item.icon />
            </div>
            <div className="metric-label">{item.label}</div>
            <div>
              <div className="metric-value-row">
                <div
                  className="metric-value"
                  title={typeof item.value === "number" ? item.value.toLocaleString() : undefined}
                >
                  {displayValue}
                </div>
                {item.delta && (
                  <span className={`metric-delta metric-delta-${item.delta.direction}`}>
                    {item.delta.text}
                  </span>
                )}
              </div>
              <div className="metric-note">{item.note ?? item.hint}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export const metricIcons = { Car, FileText, Wrench, Package, ClipboardCheck, Clock };
export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-track">
      <progress max={100} value={value} aria-label={`${value}% complete`} />
    </div>
  );
}
export interface EmptyStateProps {
  icon?: FaIconType;
  title: string;
  description: string;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "default" | "muted" | "warning";
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
  actionLabel,
  onAction,
  tone = "default",
  compact = false,
  className,
}: EmptyStateProps) {
  const toneClass =
    tone === "muted"
      ? "empty-state-tone-muted"
      : tone === "warning"
        ? "empty-state-tone-warning"
        : "empty-state-tone-default";
  const resolvedAction =
    action ??
    (actionLabel && onAction ? (
      <Button variant="outline" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null);

  return (
    <div
      data-empty-state="true"
      className={`empty-state ${compact ? "empty-state-compact" : ""} ${className ?? ""}`.trim()}
    >
      <div className={`empty-state-illustration ${toneClass}`} aria-hidden="true">
        <div className="empty-state-icon">
          <Icon size={compact ? 17 : 21} />
        </div>
      </div>
      <div className="empty-state-title">{title}</div>
      <p className="empty-state-description">{description}</p>
      {resolvedAction && <div className="empty-state-actions">{resolvedAction}</div>}
    </div>
  );
}
export type DataTableColumnConfig<K extends string = string> = {
  label: string;
  sortKey?: K;
  align?: "left" | "right";
};
export type DataTableHeader<K extends string = string> =
  string | ReactNode | DataTableColumnConfig<K>;

function isColumnConfig<K extends string>(
  header: DataTableHeader<K>,
): header is DataTableColumnConfig<K> {
  return (
    typeof header === "object" && header !== null && !isValidElement(header) && "label" in header
  );
}

const SKELETON_CELL_WIDTHS = ["w-28", "w-36", "w-24", "w-20", "w-32", "w-16"] as const;

export function DataTable<K extends string = string>({
  headers,
  children,
  empty = false,
  emptyState,
  loading = false,
  loadingRows = 5,
  sort = null,
  onSort,
}: {
  headers: readonly DataTableHeader<K>[];
  children: ReactNode;
  empty?: boolean;
  emptyState?: ReactNode;
  loading?: boolean;
  loadingRows?: number;
  sort?: SortState<K>;
  onSort?: (key: K) => void;
}) {
  const safeRows = Math.max(1, loadingRows);
  return (
    <div className="table-wrap" aria-busy={loading || undefined}>
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((h, i) => {
              if (isColumnConfig(h)) {
                const isRight = h.align === "right";
                if (h.sortKey && onSort) {
                  const sortKey = h.sortKey;
                  const isSorted = sort?.key === sortKey;
                  const direction = isSorted ? sort.direction : null;
                  return (
                    <th
                      key={sortKey}
                      scope="col"
                      aria-sort={getAriaSort(direction)}
                      className={`table-th-sortable ${isRight ? "text-right" : ""}`.trim()}
                    >
                      <button
                        type="button"
                        onClick={() => onSort(sortKey)}
                        aria-label={getSortButtonAriaLabel(h.label, direction)}
                        className={`table-sort-btn ${isSorted ? "table-sort-btn-active" : ""} ${
                          isRight ? "table-sort-btn-right" : ""
                        }`.trim()}
                      >
                        <span>{h.label}</span>
                        <SortIndicator direction={direction} />
                      </button>
                    </th>
                  );
                }
                return (
                  <th
                    key={h.label || `col-${i}`}
                    scope="col"
                    className={isRight ? "text-right" : undefined}
                  >
                    {h.label}
                  </th>
                );
              }
              return (
                <th key={typeof h === "string" ? h || `col-${i}` : i} scope="col">
                  {h}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: safeRows }, (_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="table-skeleton-row" aria-hidden="true">
                  {headers.map((h, colIndex) => {
                    const isRight = isColumnConfig(h) && h.align === "right";
                    const widthClass =
                      SKELETON_CELL_WIDTHS[(rowIndex + colIndex) % SKELETON_CELL_WIDTHS.length];
                    return (
                      <td key={`skeleton-${rowIndex}-${colIndex}`}>
                        <div
                          className={`flex flex-col gap-1.5 ${isRight ? "items-end" : ""}`.trim()}
                        >
                          <Skeleton className={`h-3.5 ${widthClass}`} />
                          {colIndex === 0 && <Skeleton className="h-2.5 w-16 opacity-70" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            : children}
        </tbody>
      </table>
      {loading && (
        <span className="sr-only" role="status" aria-live="polite">
          Loading table records...
        </span>
      )}
      {!loading && empty && (
        <div className="empty-state-wrap">
          {emptyState ?? (
            <EmptyState
              icon={Search}
              tone="muted"
              title="No matching records"
              description="No records match your current search or filter selection."
            />
          )}
        </div>
      )}
    </div>
  );
}
export function VehicleCell({ vehicle }: { vehicle?: Vehicle | undefined }) {
  return (
    <div>
      <div className="cell-title">{vehicle?.make ?? "Vehicle"}</div>
      <div className="cell-subtitle">
        {vehicle?.plate ?? "—"} · {vehicle?.id ?? "—"}
      </div>
    </div>
  );
}
export function TableFooter({ count, label = "records" }: { count: number; label?: string }) {
  return (
    <div className="table-footer">
      <span>
        Showing {count} {label}
      </span>
      <span>Updated 11 Nov 2026</span>
    </div>
  );
}
export function LineChart({ values, labels }: { values: number[]; labels: string[] }) {
  const chartValues = values.length === 6 ? values : [0, 0, 0, 0, 0, 0];
  const chartLabels = labels.length === 6 ? labels : ["", "", "", "", "", ""];
  const max = Math.max(1, ...chartValues);
  const points = chartValues.map((value, index) => ({
    x: 35 + index * 94,
    y: 134 - (value / max) * 112,
  }));
  const line = `M${points.map(({ x, y }) => `${x},${y}`).join("L")}`;
  const area = `${line}L505 134H35Z`;
  return (
    <svg
      className="chart"
      viewBox="0 0 520 170"
      role="img"
      aria-label={`Vehicles received: ${chartValues.join(", ")}`}
    >
      <path className="chart-grid" d="M35 20H505 M35 58H505 M35 96H505 M35 134H505" />
      <text x="5" y="23">
        {max}
      </text>
      <text x="5" y="61">
        {Math.round(max * (2 / 3))}
      </text>
      <text x="10" y="99">
        {Math.round(max / 3)}
      </text>
      <text x="10" y="137">
        0
      </text>
      <path className="chart-area" d={area} />
      <path className="chart-line" d={line} />
      {points.map(({ x, y }, i) => (
        <circle className="chart-point" key={i} cx={x} cy={y} r="3.6">
          <title>{`${chartLabels[i]}: ${chartValues[i]} vehicles`}</title>
        </circle>
      ))}
      {chartLabels.map((day, i) => (
        <text key={`${day}-${i}`} x={35 + i * 94} y="159" textAnchor="middle">
          {day}
        </text>
      ))}
    </svg>
  );
}
export function Workflow({ stage }: { stage: number }) {
  return (
    <div className="workflow-list">
      {workflowStages.map((name, index) => (
        <div
          key={name}
          className={`workflow-step ${index < stage ? "step-done" : index === stage ? "step-current" : ""}`}
        >
          <span className="step-number">
            {index < stage ? <Check size={13} /> : String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h3>{name}</h3>
            <p>{stageOwners[index]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
export function ExportButton({
  filename,
  rows,
}: {
  filename: string;
  rows: Record<string, unknown>[];
}) {
  return (
    <Button variant="outline" onClick={() => exportCsv(filename, rows)}>
      <Download />
      Export report
    </Button>
  );
}
export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const first = rows[0];
  if (!first) return;
  const keys = Object.keys(first);
  const escape = (value: unknown) => {
    const text = String(value ?? "");
    return `"${(/^[=+@-]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`;
  };
  const data = [
    keys.map(escape).join(","),
    ...rows.map((row) => keys.map((key) => escape(row[key])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([data], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
export function ViewAllVehicles() {
  return (
    <Button asChild variant="link" size="sm">
      <Link to="/vehicles">
        View all vehicles
        <ArrowUpRight size={13} />
      </Link>
    </Button>
  );
}
export function DateFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onChange(value === "This week" ? "This month" : "This week")}
    >
      <CalendarDays />
      {value}
    </Button>
  );
}
export function ToolbarSearch({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <form
      className="filter-search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <div className="filter-search-field">
        <Search size={14} className="filter-search-icon" aria-hidden="true" />
        <input
          type="text"
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button
            type="button"
            className="filter-search-clear"
            aria-label="Clear filter"
            title="Clear filter"
            onClick={() => onChange("")}
          >
            <X size={12} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="filter-search-btn"
        aria-label="Search records"
        title="Search"
      >
        <Search size={13} />
      </button>
    </form>
  );
}
