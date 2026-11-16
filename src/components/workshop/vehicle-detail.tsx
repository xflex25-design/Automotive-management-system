import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Status, Workflow } from "./shared";
import { useWorkspace } from "./workspace-context";
import { stageName } from "@/lib/workshop";

export function VehicleDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { vehicleFor, quotations, jobs, requisitions } = useWorkspace();
  const vehicle = id ? vehicleFor(id) : undefined;
  return (
    <Dialog
      open={!!vehicle}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-3xl modal-scroll">
        <DialogHeader>
          <DialogTitle>
            {vehicle?.make} · {vehicle?.plate}
          </DialogTitle>
          <DialogDescription>
            {vehicle?.id} · Received {vehicle?.received}
          </DialogDescription>
        </DialogHeader>
        {vehicle && (
          <>
            <dl className="detail-grid">
              <div>
                <dt>Customer</dt>
                <dd>{vehicle.customer}</dd>
              </div>
              <div>
                <dt>Contact number</dt>
                <dd>{vehicle.phone}</dd>
              </div>
              <div>
                <dt>VIN</dt>
                <dd className="font-mono text-xs">{vehicle.vin || "—"}</dd>
              </div>
              <div>
                <dt>Current stage</dt>
                <dd>
                  <Status>{vehicle.released ? "Released" : stageName(vehicle.stage)}</Status>
                </dd>
              </div>
            </dl>
            <div className="detail-notes">
              <strong>Customer complaints</strong>
              <p>{vehicle.complaints}</p>
              <strong className="block mt-4">Existing damage</strong>
              <p>{vehicle.damage}</p>
            </div>
            <div className="detail-notes">
              <strong>Workshop records</strong>
              <div className="flex flex-wrap gap-3 mt-3">
                {quotations
                  .filter((q) => q.vehicleId === id)
                  .map((q) => (
                    <span key={q.id}>
                      {q.id} · {q.status}
                    </span>
                  ))}
                {jobs
                  .filter((j) => j.vehicleId === id)
                  .map((j) => (
                    <span key={j.id}>
                      {j.id} · {j.status}
                    </span>
                  ))}
                {requisitions
                  .filter((r) => r.vehicleId === id)
                  .map((r) => (
                    <span key={r.id}>
                      {r.id} · {r.status}
                    </span>
                  ))}
              </div>
            </div>
            {vehicle.photos && vehicle.photos.length > 0 && (
              <div className="uploaded-photos">
                {vehicle.photos.map((url, i) => (
                  <img key={url} src={url} alt={`Vehicle intake photograph ${i + 1}`} />
                ))}
              </div>
            )}
            <h3 className="font-semibold text-base mt-3">Vehicle workflow</h3>
            <Workflow stage={vehicle.stage} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
