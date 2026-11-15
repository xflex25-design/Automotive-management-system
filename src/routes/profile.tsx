import { createFileRoute } from "@tanstack/react-router";
import { ProfileComponent } from "@/components/workshop/profile";
import { workshopHead } from "@/lib/route-head";

export const Route = createFileRoute("/profile")({
  head: () =>
    workshopHead(
      "User Profile & Settings",
      "Manage user details, password security, and display preferences at Hi Rider 4x4 World.",
    ),
  component: ProfilePage,
});

function ProfilePage() {
  return <ProfileComponent />;
}
