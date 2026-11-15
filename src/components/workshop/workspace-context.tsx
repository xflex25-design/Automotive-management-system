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
  sampleVehicles,
  sampleQuotations,
  sampleInventory,
  sampleJobs,
  sampleRequisitions,
  sampleInspections,
  type WorkspaceRole,
  type Vehicle,
  type Quotation,
  type InventoryCard,
  type JobCard,
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

type Links = Record<string, BackendRefs>;
const inTests = import.meta.env.MODE === "test";

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
  const [role, setRole] = useState<WorkspaceRole>("Foreman");
  const [foreman, setForeman] = useState("Foreman 01");
  const [employeeDepartment, setEmployeeDepartment] = useState("Mechanical");

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(inTests);

  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(() => {
    if (inTests) {
      return {
        email: "foreman@hirider.com",
        displayName: "Foreman 01",
        authorities: ["ROLE_FOREMAN"],
        role: "Foreman",
      };
    }
    return null;
  });

  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  const login = async (email: string, pass: string) => {
    const result = await loginWithBackend(email, pass);
    if (result.success && result.user && result.token) {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("hi_rider_auth_token", result.token);
        localStorage.setItem("hi_rider_auth_user", JSON.stringify(result.user));
      }
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      setShowOnboarding(false);
      return { success: true };
    }
    return { success: false, error: result.error || "Authentication failed" };
  };

  const register = async (email: string, pass: string, name: string) => {
    const result = await registerWithBackend(email, pass, name);
    if (result.success && result.user && result.token) {
      if (typeof window !== "undefined" && window.localStorage) {
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
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowOnboarding(false);
    toast.info("You have signed out.");
  };

  useEffect(() => {
    if (inTests || typeof window === "undefined" || !window.localStorage) return;
    const token = localStorage.getItem("hi_rider_auth_token");
    if (token) {
      setIsAuthenticated(true);
      try {
        const saved = localStorage.getItem("hi_rider_auth_user");
        if (saved) setCurrentUser(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    const savedRole = localStorage.getItem("hi_rider_role") as WorkspaceRole;
    const savedDept = localStorage.getItem("hi_rider_department");
    if (savedRole) setRole(savedRole);
    if (savedDept) setEmployeeDepartment(savedDept);
  }, []);

  const [search, setSearch] = useState("");
  const [vehicles, rawSetVehicles, vehiclesRef] = useCollection("vehicles", sampleVehicles);
  const [quotations, rawSetQuotations, quotationsRef] = useCollection(
    "quotations",
    sampleQuotations,
  );
  const [inventory, rawSetInventory] = useCollection("inventory", sampleInventory);
  const [jobs, rawSetJobs, jobsRef] = useCollection("jobs", sampleJobs);
  const [requisitions, rawSetRequisitions, requisitionsRef] = useCollection(
    "requisitions",
    sampleRequisitions,
  );
  const [inspections, rawSetInspections, inspectionsRef] = useCollection(
    "inspections",
    sampleInspections,
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
  const [activities, setActivities] = useState(() =>
    inTests
      ? [
          {
            text: "Rear shock absorbers requested for Isuzu D-Max",
            detail: "Foreman 01 · PR-0451",
            time: "10:42",
          },
          {
            text: "Toyota Land Cruiser passed final inspection",
            detail: "Foreman 03 · IN-0212",
            time: "10:15",
          },
          {
            text: "Ford Ranger quotation sent to customer",
            detail: "Foreman 02 · QT-1023",
            time: "09:36",
          },
        ]
      : [],
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
      if (inTests) return;
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
      if (inTests) return;
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
      if (inTests) return;
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
    ],
  );

  const setRequisitions: Dispatch<SetStateAction<Requisition[]>> = useCallback(
    (action) => {
      const previous = requisitionsRef.current;
      rawSetRequisitions(action);
      const next = requisitionsRef.current;
      if (inTests) return;
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
      if (inTests) return;
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
