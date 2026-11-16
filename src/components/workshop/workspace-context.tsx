import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { loginWithBackend, registerWithBackend, type AuthenticatedUser } from "@/lib/auth";
import {
  createJobCardStatusNotification,
  dispatchBrowserNotification,
  getBrowserNotificationPermission,
  isRelevantNotification,
  requestBrowserNotificationPermission,
  type BrowserNotificationPermission,
  type WorkspaceRole,
  type Vehicle,
  type Quotation,
  type InventoryCard,
  type JobCard,
  type JobCardNotification,
  type Requisition,
  type Inspection,
  type CatalogPart,
} from "@/lib/workshop";
import {
  backendApi,
  mapInspectionResponse,
  mapInventoryResponse,
  mapJobCardResponse,
  mapQuotationResponse,
  mapRequisitionResponse,
  type BackendRefs,
} from "@/lib/api";
import { getDefaultHomeForRole } from "@/lib/route-guard";

type Links = Record<string, BackendRefs>;
const inTests = import.meta.env.MODE === "test";
const backendConfigured = !inTests && Boolean(import.meta.env["VITE_COMPANY_ID"]);

function useCollection<T>(key: string, testSeed: T[]) {
  const [items, setItems] = useState<T[]>(() => {
    if (inTests) return testSeed;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = localStorage.getItem(`hi_rider_${key}`);
        if (saved) {
          return JSON.parse(saved) as T[];
        }
      }
    } catch (err) {
      console.warn(err);
    }
    return testSeed;
  });
  const current = useRef(items);

  useEffect(() => {
    if (inTests) return;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = localStorage.getItem(`hi_rider_${key}`);
        if (saved) {
          const parsed = JSON.parse(saved) as T[];
          current.current = parsed;
          setItems(parsed);
        }
      }
    } catch (err) {
      console.warn(err);
    }
  }, [key]);

  const set = useCallback<Dispatch<SetStateAction<T[]>>>(
    (action) => {
      const next =
        typeof action === "function" ? (action as (previous: T[]) => T[])(current.current) : action;
      current.current = next;
      setItems(next);
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(`hi_rider_${key}`, JSON.stringify(next));
        }
      } catch (err) {
        console.warn(err);
      }
    },
    [key],
  );
  return [items, set, current] as const;
}

function useWorkspaceState() {
  const [role, setRoleState] = useState<WorkspaceRole>(() => {
    if (!inTests && typeof window !== "undefined" && window.localStorage) {
      const savedRole = localStorage.getItem("hi_rider_role") as WorkspaceRole | null;
      if (savedRole) return savedRole;
    }
    return "Foreman";
  });
  const [foreman, setForeman] = useState("Foreman 01");
  const [employeeDepartment, setEmployeeDepartmentState] = useState(() => {
    if (!inTests && typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("hi_rider_department") || "Mechanical";
    }
    return "Mechanical";
  });

  const setRole: Dispatch<SetStateAction<WorkspaceRole>> = useCallback((action) => {
    setRoleState((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      if (!inTests && typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("hi_rider_role", next);
      }
      return next;
    });
  }, []);

  const setEmployeeDepartment: Dispatch<SetStateAction<string>> = useCallback((action) => {
    setEmployeeDepartmentState((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      if (!inTests && typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("hi_rider_department", next);
      }
      return next;
    });
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (inTests) return true;
    if (typeof window !== "undefined" && window.localStorage) {
      return Boolean(localStorage.getItem("hi_rider_auth_token"));
    }
    return false;
  });

  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(() => {
    if (inTests) {
      return {
        email: "",
        displayName: "Workshop User",
        authorities: ["ROLE_FOREMAN"],
        role: "Foreman",
      };
    }
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const saved = localStorage.getItem("hi_rider_auth_user");
        if (saved) return JSON.parse(saved) as AuthenticatedUser;
      } catch {
        // ignore
      }
    }
    return null;
  });

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (inTests) return false;
    if (typeof window !== "undefined" && window.localStorage) {
      return (
        Boolean(localStorage.getItem("hi_rider_auth_token")) &&
        localStorage.getItem("hi_rider_pending_onboarding") === "true"
      );
    }
    return false;
  });
  const [notificationPermission, setNotificationPermission] =
    useState<BrowserNotificationPermission>(() => getBrowserNotificationPermission());

  const login = async (email: string, pass: string) => {
    const result = await loginWithBackend(email, pass);
    if (result.success && result.user && result.token) {
      let resolvedRole = result.user.role;
      let resolvedDept: string | undefined;

      if (typeof window !== "undefined" && window.localStorage) {
        try {
          const map = JSON.parse(localStorage.getItem("hi_rider_account_roles") || "{}") as Record<
            string,
            { role?: WorkspaceRole; department?: string }
          >;
          const saved = map[result.user.email.toLowerCase()];
          if (saved?.role) {
            resolvedRole = saved.role;
            resolvedDept = saved.department;
          }
        } catch {
          // ignore
        }

        localStorage.removeItem("hi_rider_pending_onboarding");
        localStorage.setItem("hi_rider_onboarded", "true");

        if (resolvedRole) {
          localStorage.setItem("hi_rider_role", resolvedRole);
        }
        if (resolvedDept) {
          localStorage.setItem("hi_rider_department", resolvedDept);
        }
        localStorage.setItem("hi_rider_auth_token", result.token);
        localStorage.setItem(
          "hi_rider_auth_user",
          JSON.stringify({ ...result.user, ...(resolvedRole ? { role: resolvedRole } : {}) }),
        );
      }

      if (resolvedRole) {
        setRole(resolvedRole);
      }
      if (resolvedDept) {
        setEmployeeDepartment(resolvedDept);
      }
      setCurrentUser({
        ...result.user,
        ...(resolvedRole ? { role: resolvedRole } : {}),
      });
      setIsAuthenticated(true);
      setShowOnboarding(false);
      return { success: true, defaultHome: getDefaultHomeForRole(resolvedRole || "Foreman") };
    }
    return { success: false, error: result.error || "Authentication failed" };
  };

  const register = async (email: string, pass: string, name: string) => {
    const result = await registerWithBackend(email, pass, name);
    if (result.success && result.user && result.token) {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem("hi_rider_onboarded");
        localStorage.setItem("hi_rider_pending_onboarding", "true");
        localStorage.setItem("hi_rider_auth_token", result.token);
        localStorage.setItem("hi_rider_auth_user", JSON.stringify(result.user));
      }
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      setShowOnboarding(true);
      return { success: true };
    }
    return { success: false, error: result.error || "Registration failed" };
  };

  const logout = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("hi_rider_auth_token");
      localStorage.removeItem("hi_rider_auth_user");
      localStorage.removeItem("hi_rider_onboarded");
      localStorage.removeItem("hi_rider_pending_onboarding");
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowOnboarding(false);
    toast.info("You have signed out.");
  };

  // Auth and role state initialized synchronously from localStorage above.

  const [search, setSearch] = useState("");
  const [vehicles, rawSetVehicles, vehiclesRef] = useCollection("vehicles", [] as Vehicle[]);
  const [quotations, rawSetQuotations, quotationsRef] = useCollection(
    "quotations",
    [] as Quotation[],
  );
  const [inventory, rawSetInventory] = useCollection("inventory", [] as InventoryCard[]);
  const [jobs, rawSetJobs, jobsRef] = useCollection("jobs", [] as JobCard[]);
  const [requisitions, rawSetRequisitions, requisitionsRef] = useCollection(
    "requisitions",
    [] as Requisition[],
  );
  const [inspections, rawSetInspections, inspectionsRef] = useCollection(
    "inspections",
    [] as Inspection[],
  );
  const [parts, setParts] = useState<CatalogPart[]>([]);
  const [workflows, setWorkflows] = useState<Record<string, unknown>[]>([]);
  const [workflowOptions, setWorkflowOptions] = useState<Record<string, unknown>>({});
  const [purchaseOrders, setPurchaseOrders] = useState<Record<string, unknown>[]>([]);
  const [dispatches, setDispatches] = useState<Record<string, unknown>[]>([]);
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [handovers, setHandovers] = useState<Record<string, unknown>[]>([]);
  const [inspectionDetails, setInspectionDetails] = useState<Map<number, Record<string, unknown>>>(
    new Map(),
  );
  const recordsQuery = useQuery({
    queryKey: ["workshop-records", import.meta.env["VITE_COMPANY_ID"]],
    queryFn: backendApi.loadRecords,
    enabled: !inTests && !!import.meta.env["VITE_COMPANY_ID"],
    retry: 1,
  });
  const [activities, setActivities] = useCollection(
    "activities",
    [] as Array<{ text: string; detail: string; time: string }>,
  );
  const [notifications, rawSetNotifications] = useCollection(
    "notifications",
    inTests
      ? ([] as JobCardNotification[])
      : ([
          {
            id: "notif-init-1",
            jobId: "JC-881",
            vehicleId: "VR-1001",
            vehicleLabel: "Ford Ranger (BAK 6213)",
            department: "Mechanical",
            previousStatus: "In Repair",
            newStatus: "Completed",
            actor: "Peter Zulu (Technician)",
            targetRoles: ["Employee", "Foreman", "Management", "Director"],
            targetAudience: "Mechanical team · Foreman · Management",
            timestamp: "Today, 08:30 AM",
            read: false,
            title: "Job Card JC-881 · In Repair → Completed",
            message:
              "Ford Ranger (BAK 6213) status changed to Completed by Peter Zulu (Technician). Ready for QA inspection.",
          },
          {
            id: "notif-init-2",
            jobId: "JC-882",
            vehicleId: "VR-1002",
            vehicleLabel: "Toyota Hilux (BCA 4821)",
            department: "Panel Beating",
            previousStatus: "Pending",
            newStatus: "In Repair",
            actor: "Foreman 01",
            targetRoles: ["Employee", "Foreman", "Management", "Director"],
            targetAudience: "Panel Beating team · Foreman · Management",
            timestamp: "Today, 09:15 AM",
            read: false,
            title: "Job Card JC-882 · Pending → In Repair",
            message: "Toyota Hilux (BCA 4821) status changed to In Repair by Foreman 01.",
          },
        ] as JobCardNotification[]),
  );
  const [links, setLinks] = useState<Links>({});
  const linkRef = useRef(links);
  const [loading, setLoading] = useState(!inTests && !!import.meta.env["VITE_COMPANY_ID"]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    linkRef.current = links;
  }, [links]);
  useEffect(() => {
    if (inTests) return;
    const configured = !!import.meta.env["VITE_COMPANY_ID"];
    setLoading((recordsQuery.isPending || recordsQuery.isFetching) && configured);
    if (recordsQuery.error)
      setError(
        recordsQuery.error instanceof Error
          ? recordsQuery.error.message
          : "Could not load workshop records.",
      );
    const data = recordsQuery.data;
    if (!data) return;
    const refs: Links = {};
    const mappedVehicles: Vehicle[] = data.vehicles.map((row) => {
      const id = String(row["jobNumber"] ?? `VEH-${row["vehicleId"]}`);
      const vehicleId = Number(row["vehicleId"]);
      const jobId = Number(row["jobId"]);
      refs[id] = {
        vehicleId,
        ...(Number.isFinite(jobId) && jobId > 0 ? { jobId } : {}),
        customerId: Number(row["customerId"]),
        ...(Number(row["inventoryCardId"]) > 0
          ? { inventoryCardId: Number(row["inventoryCardId"]) }
          : {}),
      };
      return {
        id,
        plate: String(row["registrationNumber"] ?? ""),
        make: [row["make"], row["model"]].filter(Boolean).join(" "),
        customer: String(row["customerName"] ?? ""),
        phone: String(row["customerPhone"] ?? ""),
        email: String(row["customerEmail"] ?? ""),
        received: row["dateReceived"]
          ? new Date(String(row["dateReceived"])).toLocaleDateString("en-GB")
          : "",
        stage: Number(row["vehicleReleasedAt"] ? 11 : row["inventoryCardId"] ? 4 : 0),
        department: "Unassigned",
        foreman: "Workshop",
        complaints: String(row["reportedProblem"] ?? ""),
        damage:
          String(row["internalNotes"] ?? "") ||
          String(
            data.inventory.find((card) => Number(card["jobId"]) === jobId)?.["generalRemarks"] ??
              "",
          ),
        due: String(row["estimatedCompletionDate"] ?? ""),
        progress: 0,
        ...(row["vin"] ? { vin: String(row["vin"]) } : {}),
      };
    });
    const vehicleForJob = (jobId: unknown) =>
      mappedVehicles.find((v) => refs[v.id]?.jobId === Number(jobId));
    const mappedQuotes: Quotation[] = [];
    for (const [jobId, quotes] of data.quotesByJob)
      for (const row of quotes) {
        const vehicle = vehicleForJob(jobId);
        if (!vehicle) continue;
        const quoteId = Number(row["quotationId"]);
        const approval = data.approvalsByQuote.get(quoteId);
        const quote = mapQuotationResponse(row, {
          id: String(quoteId),
          vehicleId: vehicle.id,
          amount: Number(row["totalAmount"] ?? 0),
          description: String(row["foremanNotes"] ?? "Quotation"),
          status: "Draft",
        });
        if (approval) {
          const token = String(approval["customerApprovalToken"] ?? "");
          if (token) quote.customerApprovalToken = token;
          refs[vehicle.id] = { ...refs[vehicle.id], quotationId: quoteId };
        } else refs[vehicle.id] = { ...refs[vehicle.id], quotationId: quoteId };
        mappedQuotes.push(quote);
      }
    rawSetVehicles(mappedVehicles);
    rawSetQuotations(mappedQuotes);
    rawSetInventory(
      data.inventory.map((row) => {
        const v = vehicleForJob(row["jobId"]);
        const id = Number(row["inventoryCardId"]);
        if (v) refs[v.id] = { ...refs[v.id], inventoryCardId: id };
        return {
          id: String(id),
          vehicleId: v?.id ?? "",
          items:
            [
              ...(Array.isArray(row["receivedItems"])
                ? (row["receivedItems"] as Record<string, unknown>[]).map((item) =>
                    String(item["itemName"] ?? ""),
                  )
                : []),
              ...(Array.isArray(row["accessories"])
                ? (row["accessories"] as Record<string, unknown>[]).map((item) =>
                    String(item["name"] ?? ""),
                  )
                : []),
            ]
              .filter(Boolean)
              .join(", ") || "No items recorded",
          condition: String(row["generalRemarks"] ?? ""),
          date: String(row["inventoryDate"] ?? ""),
        };
      }),
    );
    rawSetJobs(
      data.jobCards.map((row) => {
        const v = vehicleForJob(row["jobId"]);
        const id = Number(row["jobCardId"]);
        const jobId = Number(row["jobId"]);
        const quoteId = Number(row["quotationId"]);
        const repairPlanId = Number(row["repairPlanId"]);
        if (v)
          refs[v.id] = {
            ...refs[v.id],
            jobCardId: id,
            jobId,
            quotationId: quoteId,
            ...(repairPlanId > 0 ? { repairPlanId } : {}),
          };
        return {
          id: String(row["jobCardNumber"] ?? id),
          vehicleId: v?.id ?? "",
          department: "Workshop",
          work: String(row["workDescription"] ?? ""),
          status: String(row["jobCardStatus"] ?? "Pending"),
          due: "",
          backendJobCardId: id,
          backendJobId: jobId,
          ...(repairPlanId > 0 ? { repairPlanId } : {}),
          parts: Array.isArray(row["parts"])
            ? (row["parts"] as Record<string, unknown>[]).map((p) => ({
                id: Number(p["jobCardPartId"]),
                ...(Number(p["partId"]) > 0 ? { partId: Number(p["partId"]) } : {}),
                code: String(p["partCode"] ?? ""),
                name: String(p["partName"] ?? ""),
                quantity: Number(p["quantity"] ?? 0),
              }))
            : [],
        };
      }),
    );
    rawSetRequisitions(
      data.requisitions.map((row) => {
        const v = vehicleForJob(row["jobId"]);
        const lines = (
          Array.isArray(row["items"]) ? (row["items"] as Record<string, unknown>[]) : []
        ).map((p) => ({
          id: Number(p["requisitionItemId"]),
          partId: Number(p["partId"]),
          code: String(p["partCode"] ?? ""),
          name: String(p["partName"] ?? ""),
          quantity: Number(p["requestedQuantity"] ?? 0),
          unit: String(p["unitOfMeasure"] ?? ""),
        }));
        const id = Number(row["requisitionId"]);
        if (v) refs[v.id] = { ...refs[v.id], requisitionId: id };
        return {
          id: String(row["requisitionNumber"] ?? id),
          backendId: id,
          vehicleId: v?.id ?? "",
          part: lines.map((x) => x.name).join(", "),
          quantity: lines.reduce((n, x) => n + x.quantity, 0),
          department: "Workshop",
          reason: String(row["purpose"] ?? ""),
          amount: 0,
          foreman: "Workshop",
          status:
            String(row["requisitionStatus"] ?? "PENDING").toUpperCase() === "APPROVED"
              ? "Approved"
              : "Pending",
          date: String(row["submittedAt"] ?? ""),
          lines,
        };
      }),
    );
    rawSetInspections(
      data.inspections.map((row) => {
        const v = vehicleForJob(row["jobId"]);
        const id = Number(row["inspectionId"]);
        if (v) refs[v.id] = { ...refs[v.id], inspectionId: id };
        return {
          id: String(row["inspectionNumber"] ?? id),
          backendId: id,
          vehicleId: v?.id ?? "",
          foreman: String(row["inspectorName"] ?? "Workshop"),
          date: String(row["startedAt"] ?? ""),
          result: String(row["inspectionDecision"] ?? "").includes("PASS")
            ? "Passed"
            : String(row["inspectionDecision"] ?? "").includes("FAIL")
              ? "Rework required"
              : "Pending",
          notes: String(row["inspectionNotes"] ?? ""),
        };
      }),
    );
    setParts(
      data.parts.map((row) => ({
        id: Number(row["partId"] ?? row["id"]),
        code: String(row["partCode"] ?? ""),
        name: String(row["partName"] ?? ""),
        unit: String(row["unitOfMeasure"] ?? "EACH"),
        description: String(row["description"] ?? ""),
      })),
    );
    setWorkflows(data.workflows);
    setWorkflowOptions(data.options);
    setPurchaseOrders(data.purchaseOrders);
    setDispatches(Array.from(data.dispatchesByJob.values()).flat());
    setInvoices(Array.from(data.invoicesByJob.values()).flat());
    setHandovers(Array.from(data.handoversByJob.values()).filter((item) => item !== null));
    setInspectionDetails(data.inspectionDetails);
    linkRef.current = refs;
    setLinks(refs);
  }, [
    recordsQuery.data,
    recordsQuery.error,
    recordsQuery.isFetching,
    recordsQuery.isPending,
    rawSetVehicles,
    rawSetQuotations,
    rawSetInventory,
    rawSetJobs,
    rawSetRequisitions,
    rawSetInspections,
  ]);

  const intakeMutation = useMutation({ mutationFn: backendApi.createIntake });
  const quotationMutation = useMutation({
    mutationFn: ({ jobId, quotation }: { jobId: number; quotation: Quotation }) =>
      backendApi.createQuotation(
        jobId,
        quotation,
        parts.find((p) => p.id === quotation.catalogPartId),
      ),
  });
  const jobCardMutation = useMutation({
    mutationFn: ({ job, refs }: { job: JobCard; refs: BackendRefs }) =>
      backendApi.createJobCard(job, refs),
  });
  const requisitionMutation = useMutation({
    mutationFn: ({ jobId, requisition }: { jobId: number; requisition: Requisition }) =>
      backendApi.createRequisition(jobId, requisition),
  });
  const inspectionMutation = useMutation({ mutationFn: backendApi.startFinalInspection });

  const reportFailure = useCallback((cause: unknown) => {
    const message = cause instanceof Error ? cause.message : "The backend request failed.";
    setError(message);
    toast.error(message);
  }, []);
  const persist = useCallback(
    async (work: () => Promise<void>) => {
      setError(null);
      try {
        await work();
      } catch (cause) {
        reportFailure(cause);
      }
    },
    [reportFailure],
  );
  const updateLinks = useCallback((id: string, update: Partial<BackendRefs>) => {
    const next = { ...linkRef.current, [id]: { ...linkRef.current[id], ...update } };
    linkRef.current = next;
    setLinks(next);
  }, []);

  const setVehicles: Dispatch<SetStateAction<Vehicle[]>> = useCallback(
    (action) => {
      const previous = vehiclesRef.current;
      rawSetVehicles(action);
      const next = vehiclesRef.current;
      if (!backendConfigured) return;
      const added = next.filter((item) => !previous.some((old) => old.id === item.id));
      for (const vehicle of added)
        void persist(async () => {
          const response = await intakeMutation.mutateAsync(vehicle);
          const refs = {
            jobId: response.jobId,
            vehicleId: response.vehicleId,
            customerId: response.customerId,
            inventoryCardId: response.inventoryCardId,
          };
          updateLinks(vehicle.id, refs);
          const mapped = {
            ...vehicle,
            id: vehicle.id,
            plate: response.registrationNumber || vehicle.plate,
          };
          rawSetVehicles((items) => items.map((item) => (item.id === vehicle.id ? mapped : item)));
          const card: InventoryCard = mapInventoryResponse(response, {
            id: String(response.inventoryCardId),
            vehicleId: vehicle.id,
            items: "Created at intake",
            condition: vehicle.damage,
            date: vehicle.received,
          });
          rawSetInventory((items) =>
            items.some((item) => item.vehicleId === vehicle.id) ? items : [card, ...items],
          );
          await recordsQuery.refetch();
        });
    },
    [
      vehiclesRef,
      rawSetVehicles,
      rawSetInventory,
      persist,
      intakeMutation,
      updateLinks,
      recordsQuery,
    ],
  );

  const setQuotations: Dispatch<SetStateAction<Quotation[]>> = useCallback(
    (action) => {
      const previous = quotationsRef.current;
      rawSetQuotations(action);
      const next = quotationsRef.current;
      if (!backendConfigured) return;
      for (const quotation of next.filter((item) => !previous.some((old) => old.id === item.id))) {
        const refs = linkRef.current[quotation.vehicleId];
        if (!refs?.jobId) {
          if (!inTests) {
            reportFailure(
              new Error("This vehicle has no saved backend job yet; create its intake first."),
            );
          }
          continue;
        }
        void persist(async () => {
          const response = await quotationMutation.mutateAsync({ jobId: refs.jobId!, quotation });
          const quotationId = Number(response["quotationId"]);
          updateLinks(quotation.vehicleId, { quotationId });
          rawSetQuotations((items) =>
            items.map((item) =>
              item.id === quotation.id ? mapQuotationResponse(response, item) : item,
            ),
          );
          await recordsQuery.refetch();
        });
      }
      for (const quotation of next) {
        const old = previous.find((item) => item.id === quotation.id);
        const refs = linkRef.current[quotation.vehicleId];
        if (
          old?.status === "Draft" &&
          quotation.status === "Awaiting approval" &&
          refs?.quotationId
        ) {
          void persist(async () => {
            await backendApi.issueQuotation(refs.quotationId!);
            await backendApi.requestQuotationApproval(refs.quotationId!);
          });
        }
      }
    },
    [
      quotationsRef,
      rawSetQuotations,
      quotationMutation,
      persist,
      reportFailure,
      updateLinks,
      recordsQuery,
    ],
  );

  const setJobs: Dispatch<SetStateAction<JobCard[]>> = useCallback(
    (action) => {
      const previous = jobsRef.current;
      rawSetJobs(action);
      const next = jobsRef.current;
      for (const updatedJob of next) {
        const oldJob = previous.find((old) => old.id === updatedJob.id);
        if (
          oldJob &&
          oldJob.status.trim().toLowerCase() !== updatedJob.status.trim().toLowerCase()
        ) {
          const vehicle = vehiclesRef.current.find((v) => v.id === updatedJob.vehicleId);
          const vehicleLabel = vehicle
            ? `${vehicle.make}${vehicle.plate ? ` (${vehicle.plate})` : ""}`
            : undefined;
          const actorName =
            updatedJob.auditTrail?.[0]?.actor?.trim() ||
            currentUser?.displayName?.trim() ||
            (role === "Foreman"
              ? foreman
              : role === "Employee"
                ? `${employeeDepartment} Staff`
                : role);
          const notification = createJobCardStatusNotification({
            job: updatedJob,
            previousStatus: oldJob.status,
            newStatus: updatedJob.status,
            actor: actorName,
            ...(vehicleLabel ? { vehicleLabel } : {}),
          });
          if (notification) {
            rawSetNotifications((items) => [notification, ...items].slice(0, 50));
            dispatchBrowserNotification(notification, {
              onFallbackAlert: (alert) => {
                toast.info(alert.title, {
                  description: `${alert.message} Notifying: ${alert.targetAudience}`,
                });
              },
            });
          }
        }
      }
      if (!backendConfigured) return;
      for (const job of next.filter((item) => !previous.some((old) => old.id === item.id))) {
        const vehicle = vehiclesRef.current.find((item) => item.id === job.vehicleId);
        const refs = linkRef.current[job.vehicleId];
        if (!vehicle || !refs?.jobId || !refs.quotationId) {
          if (!inTests) {
            reportFailure(
              new Error("A saved intake and quotation are required before creating a job card."),
            );
          }
          continue;
        }
        void persist(async () => {
          const response = await jobCardMutation.mutateAsync({ job, refs });
          const jobCardId = Number(response["jobCardId"] ?? response["id"]);
          updateLinks(job.vehicleId, { jobCardId });
          const repairPlanId = Number(response["repairPlanId"]);
          if (repairPlanId > 0) updateLinks(job.vehicleId, { repairPlanId });
          const cardDetails = await backendApi.getJobCard(jobCardId);
          const partLines = Array.isArray(cardDetails["parts"])
            ? (cardDetails["parts"] as Record<string, unknown>[])
            : [];
          for (const line of partLines) {
            const catalogPart = parts.find(
              (p) => p.code === String(line["partNumber"] ?? line["partCode"] ?? ""),
            );
            if (catalogPart && line["jobCardPartId"])
              await backendApi.linkJobCardPart(
                jobCardId,
                Number(line["jobCardPartId"]),
                catalogPart.id,
              );
          }
          rawSetJobs((items) =>
            items.map((item) => (item.id === job.id ? mapJobCardResponse(response, item) : item)),
          );
          await recordsQuery.refetch();
        });
      }
    },
    [
      jobsRef,
      rawSetJobs,
      vehiclesRef,
      jobCardMutation,
      persist,
      reportFailure,
      updateLinks,
      parts,
      recordsQuery,
      rawSetNotifications,
      currentUser,
      role,
      foreman,
      employeeDepartment,
    ],
  );

  const setRequisitions: Dispatch<SetStateAction<Requisition[]>> = useCallback(
    (action) => {
      const previous = requisitionsRef.current;
      rawSetRequisitions(action);
      const next = requisitionsRef.current;
      if (!backendConfigured) return;
      for (const requisition of next.filter(
        (item) => !previous.some((old) => old.id === item.id),
      )) {
        const refs = linkRef.current[requisition.vehicleId];
        if (!refs?.jobId) {
          if (!inTests) reportFailure(new Error("This vehicle has no saved backend job yet."));
          continue;
        }
        void persist(async () => {
          const response = await requisitionMutation.mutateAsync({
            jobId: refs.jobId!,
            requisition,
          });
          const requisitionId = Number(response["requisitionId"]);
          updateLinks(requisition.vehicleId, { requisitionId });
          rawSetRequisitions((items) =>
            items.map((item) =>
              item.id === requisition.id ? mapRequisitionResponse(response, item) : item,
            ),
          );
          await recordsQuery.refetch();
        });
      }
    },
    [
      requisitionsRef,
      rawSetRequisitions,
      requisitionMutation,
      persist,
      reportFailure,
      updateLinks,
      recordsQuery,
    ],
  );

  const setInspections: Dispatch<SetStateAction<Inspection[]>> = useCallback(
    (action) => {
      const previous = inspectionsRef.current;
      rawSetInspections(action);
      const next = inspectionsRef.current;
      if (!backendConfigured) return;
      for (const inspection of next.filter((item) => !previous.some((old) => old.id === item.id))) {
        const refs = linkRef.current[inspection.vehicleId];
        if (!refs?.jobId) {
          if (!inTests) reportFailure(new Error("This vehicle has no saved backend job yet."));
          continue;
        }
        void persist(async () => {
          const response = await inspectionMutation.mutateAsync(refs.jobId!);
          const inspectionId = Number(response["inspectionId"]);
          updateLinks(inspection.vehicleId, { inspectionId });
          rawSetInspections((items) =>
            items.map((item) =>
              item.id === inspection.id ? mapInspectionResponse(response, item) : item,
            ),
          );
          await recordsQuery.refetch();
        });
      }
    },
    [
      inspectionsRef,
      rawSetInspections,
      inspectionMutation,
      persist,
      reportFailure,
      updateLinks,
      recordsQuery,
    ],
  );

  function addActivity(text: string, detail: string) {
    setActivities((prev) => [{ text, detail, time: "Just now" }, ...prev]);
  }
  function updateVehicleStage(id: string, stage: number) {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, stage: Math.max(v.stage, stage) } : v)),
    );
  }
  function vehicleFor(id: string) {
    return vehicles.find((v) => v.id === id);
  }
  const enableBrowserNotifications = useCallback(async () => {
    const perm = await requestBrowserNotificationPermission();
    setNotificationPermission(perm);
    if (perm === "granted") {
      toast.success("Browser alerts enabled for job card status changes.");
    } else if (perm === "denied") {
      toast.error("Browser notifications are blocked in your browser settings.");
    } else if (perm === "unsupported") {
      toast.info("Browser desktop notifications are unavailable; in-app alerts remain active.");
    }
    return perm;
  }, []);

  const markNotificationRead = useCallback(
    (id: string) => {
      rawSetNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [rawSetNotifications],
  );

  const markAllNotificationsRead = useCallback(() => {
    rawSetNotifications((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
  }, [rawSetNotifications]);

  const clearNotifications = useCallback(() => {
    rawSetNotifications([]);
  }, [rawSetNotifications]);

  const sendTestNotification = useCallback(() => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const testNotif: JobCardNotification = {
      id: `notif-test-${Date.now()}`,
      jobId: "JC-881",
      vehicleId: "VR-1001",
      vehicleLabel: "Ford Ranger (BAK 6213)",
      department: employeeDepartment || "Mechanical",
      previousStatus: "In Repair",
      newStatus: "Completed",
      actor: currentUser?.displayName || (role === "Foreman" ? foreman : `${role} Staff`),
      targetRoles: ["Employee", "Foreman", "Management", "Director"],
      targetAudience: "Mechanical team · Foreman · Management",
      timestamp: `Today, ${timeStr}`,
      read: false,
      title: "Job Card JC-881 · In Repair → Completed",
      message: "Ford Ranger (BAK 6213) status changed to Completed. Ready for QA inspection.",
    };
    rawSetNotifications((prev) => [testNotif, ...prev].slice(0, 50));
    dispatchBrowserNotification(testNotif, {
      onFallbackAlert: (alert) => {
        toast.info(alert.title, {
          description: `${alert.message} Notifying: ${alert.targetAudience}`,
        });
      },
    });
  }, [currentUser, employeeDepartment, foreman, role, rawSetNotifications]);

  const relevantNotifications = notifications.filter((notification) =>
    isRelevantNotification(notification, {
      role,
      department: employeeDepartment,
      employeeName: currentUser?.displayName,
    }),
  );
  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return {
    isAuthenticated,
    currentUser,
    showOnboarding,
    setShowOnboarding,
    login,
    register,
    logout,
    role,
    setRole,
    foreman,
    setForeman,
    employeeDepartment,
    setEmployeeDepartment,
    search,
    setSearch,
    vehicles,
    setVehicles,
    quotations,
    setQuotations,
    inventory,
    setInventory: rawSetInventory,
    jobs,
    setJobs,
    requisitions,
    setRequisitions,
    inspections,
    setInspections,
    activities,
    addActivity,
    notifications,
    relevantNotifications,
    unreadNotificationCount,
    notificationPermission,
    enableBrowserNotifications,
    sendTestNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    updateVehicleStage,
    vehicleFor,
    loading,
    error,
    backendRefs: links,
    parts,
    refresh: recordsQuery.refetch,
    viewCustomerApproval: backendApi.viewCustomerApproval,
    submitCustomerApproval: backendApi.submitCustomerApproval,
    workflows,
    workflowOptions,
    purchaseOrders,
    dispatches,
    invoices,
    handovers,
    inspectionDetails,
    api: backendApi,
  };
}

type Workspace = ReturnType<typeof useWorkspaceState>;
const WorkspaceContext = createContext<Workspace | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const value = useWorkspaceState();
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("Workshop screens require WorkspaceProvider");
  return context;
}
