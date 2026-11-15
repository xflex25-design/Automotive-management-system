import { createFileRoute } from "@tanstack/react-router";
import { PageHeading } from "@/components/workshop/shared";
import { useWorkspace } from "@/components/workshop/workspace-context";
import { workshopHead } from "@/lib/route-head";

export const Route = createFileRoute("/settings")({
  head: () =>
    workshopHead(
      "Account Settings",
      "Account and view settings for the Hi Rider 4x4 World workshop.",
    ),
  component: SettingsPage,
});

function SettingsPage() {
  const w = useWorkspace();
  return (
    <div>
      <PageHeading title="Account Settings" subtitle="Your current workspace view" />
      <div className="rounded-lg border bg-card p-5 text-sm space-y-2">
        <p>
          <span className="text-muted-foreground">Current view:</span> {w.role}
        </p>
      </div>
    </div>
  );
}
