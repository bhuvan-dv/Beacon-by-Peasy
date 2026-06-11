"use client";

import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { daysRemaining, urgencyStatus } from "@/lib/reorder";
import { URGENCY_RANK, URGENCY_STYLES } from "@/lib/urgency";
import type { InventoryItem, Urgency } from "@/types";

type FilterTab = "all" | Urgency;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "urgent", label: "Urgent" },
  { id: "watch", label: "Watch" },
  { id: "healthy", label: "Healthy" },
];

type InventoryTableProps = {
  items: InventoryItem[];
  /** Fired when an urgent/watch row is clicked. Healthy rows do nothing. */
  onFlaggedRowClick?: (item: InventoryItem) => void;
};

/** Days-remaining bar: width scales with how much runway is left, capped at 100%. */
function DaysLeftCell({ item }: { item: InventoryItem }) {
  const days = daysRemaining(item);
  const status = urgencyStatus(item);
  const ceiling = item.leadTimeDays + 10;
  const pct = Math.max(
    6,
    Math.min(100, Math.round((days / ceiling) * 100)),
  );

  return (
    <div className="min-w-[88px]">
      <span className="text-sm font-medium tabular-nums text-slate-900">
        {Number.isFinite(days) ? `${days.toFixed(1)} d` : "—"}
      </span>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full", URGENCY_STYLES[status].bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Urgency }) {
  const style = URGENCY_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        style.badge,
      )}
    >
      {style.label}
    </span>
  );
}

function SortButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="-ml-3 h-8 px-3 text-muted-foreground hover:text-slate-900"
    >
      {label}
      <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
    </Button>
  );
}

export function InventoryTable({
  items,
  onFlaggedRowClick,
}: InventoryTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [filter, setFilter] = React.useState<FilterTab>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const columns = React.useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        id: "name",
        header: "Item",
        cell: ({ row }) => {
          const item = row.original;
          const isPackaging = item.category === "packaging";
          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-slate-900">{item.name}</span>
              <span
                className={cn(
                  "w-fit rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  isPackaging
                    ? "bg-violet-50 text-violet-600"
                    : item.category === "ingredient"
                      ? "bg-sky-50 text-sky-600"
                      : "bg-slate-100 text-slate-500",
                )}
              >
                {item.category}
              </span>
            </div>
          );
        },
      },
      {
        id: "supplier",
        header: "Supplier",
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.supplier}
          </span>
        ),
      },
      {
        id: "onHand",
        header: "On hand",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-slate-700">
            {row.original.onHand} {row.original.unit}
          </span>
        ),
      },
      {
        id: "dailyVelocity",
        header: "Daily use",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-slate-700">
            {row.original.dailyVelocity}/day
          </span>
        ),
      },
      {
        id: "daysLeft",
        accessorFn: (item) => daysRemaining(item),
        header: ({ column }) => (
          <SortButton
            label="Days left"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          />
        ),
        cell: ({ row }) => <DaysLeftCell item={row.original} />,
        sortingFn: "basic",
      },
      {
        id: "leadTime",
        header: "Lead time",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-slate-700">
            {row.original.leadTimeDays} d
          </span>
        ),
      },
      {
        id: "status",
        accessorFn: (item) => URGENCY_RANK[urgencyStatus(item)],
        header: ({ column }) => (
          <SortButton
            label="Status"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          />
        ),
        cell: ({ row }) => (
          <StatusBadge status={urgencyStatus(row.original)} />
        ),
        sortingFn: "basic",
      },
    ],
    [],
  );

  const filteredItems = React.useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => urgencyStatus(item) === filter);
  }, [items, filter]);

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  function handleRowClick(item: InventoryItem) {
    const status = urgencyStatus(item);
    if (status === "healthy") return;
    setSelectedId(item.id);
    onFlaggedRowClick?.(item);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === tab.id
                ? "bg-orange-500 text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="bg-slate-50/80">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const status = urgencyStatus(row.original);
                const isFlagged = status !== "healthy";
                const isSelected = selectedId === row.original.id;
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => handleRowClick(row.original)}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      isFlagged ? "cursor-pointer" : "cursor-default",
                      isSelected && "bg-orange-50 hover:bg-orange-50",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-slate-500"
                >
                  No items in this view.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
