import { useEffect, useState } from "react";
import { useWorkspace } from "./workspace-context";
import type { WorkspaceRole } from "@/lib/workshop";

export function useHashRouter() {
  const { setRole } = useWorkspace();
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || "#foreman");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "#foreman";
      setCurrentHash(hash);

      if (hash.includes("management")) {
        setRole("Management");
      } else if (hash.includes("director") || hash.includes("approvals")) {
        setRole("Director");
      } else if (hash.includes("employee")) {
        setRole("Employee");
      } else {
        setRole("Foreman");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // initial sync

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [setRole]);

  const navigateHash = (hashPath: string, roleTarget?: WorkspaceRole) => {
    if (roleTarget) {
      setRole(roleTarget);
    }
    window.location.hash = hashPath.startsWith("#") ? hashPath : `#${hashPath}`;
  };

  return { currentHash, navigateHash };
}
