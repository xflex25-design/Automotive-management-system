import * as React from "react";

import { cn } from "@/lib/utils";
import type { SortDirection } from "@/lib/workshop";

export function getAriaSort(
  direction: SortDirection | null | undefined,
): "none" | "ascending" | "descending" {
  if (direction === "asc") return "ascending";
  if (direction === "desc") return "descending";
  return "none";
}

export function getSortButtonAriaLabel(
  label: string,
  direction: SortDirection | null | undefined,
): string {
  const clean = label.trim() || "column";
  if (direction === "asc") {
    return `Sort by ${clean}, currently sorted ascending. Activate to sort descending.`;
  }
  if (direction === "desc") {
    return `Sort by ${clean}, currently sorted descending. Activate to clear sorting.`;
  }
  return `Sort by ${clean}, currently unsorted. Activate to sort ascending.`;
}

export function SortIndicator({
  direction,
  className,
}: {
  direction: SortDirection | null | undefined;
  className?: string;
}) {
  const state = direction ?? "none";
  return (
    <span
      className={cn(
        "table-sort-indicator",
        state !== "none" && "table-sort-indicator-active",
        className,
      )}
      data-sort-direction={state}
      aria-hidden="true"
    >
      <svg
        width="10"
        height="14"
        viewBox="0 0 10 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="table-sort-svg"
      >
        <path
          d="M5 1L8.5 5.25H1.5L5 1Z"
          className={cn("table-sort-arrow table-sort-arrow-up", direction === "asc" && "is-active")}
          fill="currentColor"
        />
        <path
          d="M5 13L1.5 8.75H8.5L5 13Z"
          className={cn(
            "table-sort-arrow table-sort-arrow-down",
            direction === "desc" && "is-active",
          )}
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm tabular-nums", className)}
        {...props}
      />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortDirection?: SortDirection | null;
  onSort?: () => void;
  sortLabel?: string;
  align?: "left" | "right";
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  (
    { className, children, sortDirection, onSort, sortLabel, align = "left", scope, ...props },
    ref,
  ) => {
    const isRight = align === "right";
    const isSorted = sortDirection === "asc" || sortDirection === "desc";
    const resolvedLabel =
      sortLabel ??
      (typeof children === "string" || typeof children === "number" ? String(children) : "");

    if (onSort) {
      return (
        <th
          ref={ref}
          scope={scope ?? "col"}
          aria-sort={getAriaSort(sortDirection)}
          className={cn(
            "h-10 p-0 align-middle text-xs font-semibold tracking-label tabular-nums text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
            isRight ? "text-right" : "text-left",
            className,
          )}
          {...props}
        >
          <button
            type="button"
            onClick={onSort}
            aria-label={getSortButtonAriaLabel(resolvedLabel, sortDirection)}
            className={cn(
              "table-sort-btn table-sort-btn-ui",
              isSorted && "table-sort-btn-active",
              isRight && "table-sort-btn-right",
            )}
          >
            <span>{children}</span>
            <SortIndicator direction={sortDirection} />
          </button>
        </th>
      );
    }

    return (
      <th
        ref={ref}
        scope={scope ?? "col"}
        className={cn(
          "h-10 px-2 align-middle text-xs font-semibold tracking-label tabular-nums text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
          isRight ? "text-right" : "text-left",
          className,
        )}
        {...props}
      >
        {children}
      </th>
    );
  },
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle text-[length:var(--type-table-cell-size)] font-normal tabular-nums [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-xs font-medium text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
