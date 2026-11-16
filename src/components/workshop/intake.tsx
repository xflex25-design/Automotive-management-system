import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Car, RotateCcw, Search } from "./fa-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "./workspace-context";
import {
  DataTable,
  EmptyState,
  SectionHeading,
  Status,
  TableFooter,
  ToolbarSearch,
  VehicleCell,
} from "./shared";
import { VehicleDetail } from "./vehicle-detail";
import {
  filterVehicles,
  getVehicleStatusCategory,
  nextSortState,
  sortRecords,
  vehicleRegistrationStatuses,
  workflowStages,
  type SortState,
  type VehicleRegistrationStatusFilter,
} from "@/lib/workshop";

export function IntakePage() {
  const { vehicles, setVehicles, foreman, addActivity, loading } = useWorkspace();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleRegistrationStatusFilter>("All");
  const [sort, setSort] = useState<SortState>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const filteredVehicles = sortRecords(
    filterVehicles(vehicles, { query, status: statusFilter }),
    sort,
    (v, key) => {
      switch (key) {
        case "vehicle":
          return `${v.make} ${v.id}`;
        case "vin":
          return v.vin ?? "";
        case "plate":
          return v.plate;
        case "customer":
          return v.customer;
        case "received":
          return v.received;
        case "status":
          return getVehicleStatusCategory(v);
        case "stage":
          return v.released ? 999 : v.stage;
        default:
          return "";
      }
    },
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const plate = String(form.get("plate") ?? "")
      .trim()
      .toUpperCase();
    const vin = String(form.get("vin") ?? "")
      .trim()
      .toUpperCase();
    if (vehicles.some((v) => v.plate === plate && !v.released)) {
      toast.error("This registration already has an active workshop record.");
      return;
    }
    setSaving(true);
    try {
      const maxId = vehicles.reduce((max, item) => {
        const match = item.id.match(/^VR-(\d+)$/);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 1060);
      const id = `VR-${maxId + 1}`;
      const todayLabel = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      setVehicles((prev) => [
        {
          id,
          plate,
          make: String(form.get("make")).trim(),
          customer: String(form.get("customer")).trim(),
          phone: String(form.get("phone")).trim(),
          email: String(form.get("email")).trim(),
          received: todayLabel,
          stage: 0,
          department: "Unassigned",
          foreman,
          complaints: String(form.get("complaints")).trim(),
          damage: String(form.get("damage")).trim(),
          due: "",
          progress: 0,
          ...(vin ? { vin } : {}),
          ...(String(form.get("odometer") ?? "") ? { odometer: Number(form.get("odometer")) } : {}),
          ...(String(form.get("colour") ?? "") ? { color: String(form.get("colour")).trim() } : {}),
        },
        ...prev,
      ]);
      addActivity(`Vehicle registered: ${String(form.get("make"))}`, `${foreman} · ${id}`);
      toast.success(`${plate} registered. Ready for quotation.`);
      navigate({ to: "/vehicles" });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Vehicle registration failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="registration-panel">
        <div className="registration-header">
          <h1>Vehicle Registration</h1>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/vehicles" })}
          >
            Vehicle records
            <ArrowRight />
          </Button>
        </div>

        <form onSubmit={submit}>
          <div className="registration-grid">
            <div className="registration-row">
              <label htmlFor="reg-customer" className="registration-label">
                Full Name <span className="registration-required">*</span>
              </label>
              <Input
                id="reg-customer"
                name="customer"
                placeholder="Customer full name"
                className="registration-input"
                required
              />
            </div>

            <div className="registration-row">
              <label htmlFor="reg-plate" className="registration-label">
                Registration Number <span className="registration-required">*</span>
              </label>
              <Input
                id="reg-plate"
                name="plate"
                placeholder="e.g. BCA 4821"
                className="registration-input"
                required
              />
            </div>

            <div className="registration-row">
              <label htmlFor="reg-phone" className="registration-label">
                Phone Number <span className="registration-required">*</span>
              </label>
              <Input
                id="reg-phone"
                type="tel"
                name="phone"
                placeholder="+260"
                className="registration-input"
                required
              />
            </div>

            <div className="registration-row">
              <label htmlFor="reg-make" className="registration-label">
                Make &amp; Model <span className="registration-required">*</span>
              </label>
              <Input
                id="reg-make"
                name="make"
                placeholder="e.g. Toyota Hilux"
                className="registration-input"
                required
              />
            </div>

            <div className="registration-row">
              <label htmlFor="reg-email" className="registration-label">
                Email Address
              </label>
              <Input
                id="reg-email"
                type="email"
                name="email"
                placeholder="customer@example.com"
                className="registration-input"
              />
            </div>

            <div className="registration-row">
              <label htmlFor="reg-vin" className="registration-label">
                Chassis / VIN Number
              </label>
              <Input
                id="reg-vin"
                name="vin"
                placeholder="Vehicle identification number"
                className="registration-input"
              />
            </div>

            <div className="registration-row">
              <label htmlFor="reg-colour" className="registration-label">
                Vehicle Colour
              </label>
              <Input
                id="reg-colour"
                name="colour"
                placeholder="e.g. White"
                className="registration-input"
              />
            </div>

            <div className="registration-row">
              <label htmlFor="reg-odometer" className="registration-label">
                Odometer Reading (km)
              </label>
              <Input
                id="reg-odometer"
                name="odometer"
                type="number"
                min="0"
                placeholder="e.g. 124500"
                className="registration-input"
              />
            </div>

            <div className="registration-row registration-row-top">
              <label htmlFor="reg-complaints" className="registration-label">
                Customer Complaints <span className="registration-required">*</span>
              </label>
              <Textarea
                id="reg-complaints"
                name="complaints"
                rows={3}
                placeholder="Record the customer's concerns and requested repairs"
                className="registration-textarea"
                required
              />
            </div>

            <div className="registration-row registration-row-top">
              <label htmlFor="reg-damage" className="registration-label">
                Existing Damage <span className="registration-required">*</span>
              </label>
              <Textarea
                id="reg-damage"
                name="damage"
                rows={3}
                placeholder="Record dents, scratches, or state no visible damage"
                className="registration-textarea"
                required
              />
            </div>
          </div>

          <div className="registration-actions">
            <Button type="submit" disabled={saving} className="registration-submit-btn">
              {saving ? "Submitting…" : "Submit"}
            </Button>
            <Button type="reset" variant="outline" className="registration-reset-btn">
              Reset
            </Button>
          </div>
        </form>
      </section>

      <section className="table-section">
        <SectionHeading
          title="Registered Vehicles"
          subtitle="Filter registered vehicles by VIN, license plate, or owner name in real time"
        />
        <div className="toolbar">
          <ToolbarSearch
            ariaLabel="Search registered vehicles by VIN, license plate, or owner name"
            placeholder="Search by VIN, license plate, or owner name..."
            value={query}
            onChange={setQuery}
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as VehicleRegistrationStatusFilter)}
          >
            <SelectTrigger
              className="w-[200px] h-[38px] rounded-[6px] border-[#d1d5db] bg-background text-sm font-normal shadow-none"
              aria-label="Filter vehicle status"
            >
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
        </div>

        <DataTable
          headers={[
            { label: "Vehicle", sortKey: "vehicle" },
            { label: "VIN", sortKey: "vin" },
            { label: "License plate", sortKey: "plate" },
            { label: "Owner", sortKey: "customer" },
            { label: "Received", sortKey: "received" },
            { label: "Status", sortKey: "status" },
            { label: "Current stage", sortKey: "stage" },
            "Actions",
          ]}
          loading={loading}
          sort={sort}
          onSort={(key) => setSort((current) => nextSortState(current, key))}
          empty={filteredVehicles.length === 0}
          emptyState={
            query.trim() || statusFilter !== "All" ? (
              <EmptyState
                icon={Search}
                tone="muted"
                title="No matching registered vehicles"
                description="No registered vehicles match the selected status or search criteria."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setStatusFilter("All");
                    }}
                  >
                    <RotateCcw />
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Car}
                tone="muted"
                title="No vehicles registered yet"
                description="Submit the vehicle registration form above to add a vehicle to the workshop listing."
              />
            )
          }
        >
          {filteredVehicles.map((v) => (
            <tr key={v.id}>
              <td>
                <VehicleCell vehicle={v} />
              </td>
              <td>
                <span className="font-mono text-xs">{v.vin || "—"}</span>
              </td>
              <td>{v.plate}</td>
              <td>{v.customer}</td>
              <td>{v.received}</td>
              <td>
                <Status>{getVehicleStatusCategory(v)}</Status>
              </td>
              <td>
                <Status>{v.released ? "Released" : (workflowStages[v.stage] ?? "Intake")}</Status>
              </td>
              <td>
                <Button
                  variant="ghost"
                  size="icon"
                  title={`View ${v.plate}`}
                  aria-label={`View ${v.plate}`}
                  onClick={() => setDetailId(v.id)}
                >
                  <ArrowUpRight />
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
        <TableFooter count={filteredVehicles.length} label="vehicles" />
      </section>

      <VehicleDetail id={detailId} onClose={() => setDetailId(null)} />
    </>
  );
}
