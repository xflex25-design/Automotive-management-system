import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "./fa-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "./workspace-context";

export function IntakePage() {
  const { vehicles, setVehicles, foreman, addActivity } = useWorkspace();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const plate = String(form.get("plate") ?? "")
      .trim()
      .toUpperCase();
    if (vehicles.some((v) => v.plate === plate && !v.released)) {
      toast.error("This registration already has an active workshop record.");
      return;
    }
    setSaving(true);
    try {
      const id = `VR-${1069 + vehicles.length - 8}`;
      setVehicles((prev) => [
        {
          id,
          plate,
          make: String(form.get("make")),
          customer: String(form.get("customer")),
          phone: String(form.get("phone")),
          email: String(form.get("email")),
          received: "11 Nov 2026",
          stage: 0,
          department: "Unassigned",
          foreman,
          complaints: String(form.get("complaints")),
          damage: String(form.get("damage")),
          due: "",
          progress: 0,
          ...(String(form.get("vin") ?? "") ? { vin: String(form.get("vin")) } : {}),
          ...(String(form.get("odometer") ?? "") ? { odometer: Number(form.get("odometer")) } : {}),
          ...(String(form.get("colour") ?? "") ? { color: String(form.get("colour")) } : {}),
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
  );
}
