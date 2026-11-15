import type {
  CatalogPart,
  Inspection,
  InventoryCard,
  JobCard,
  Quotation,
  Requisition,
  Vehicle,
} from "./workshop";

const configuredApiUrl = import.meta.env["VITE_API_URL"]?.replace(/\/$/, "") ?? "";
const apiPrefix = import.meta.env.DEV ? "/backend-api" : configuredApiUrl;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const authToken =
    typeof window !== "undefined" && window.localStorage
      ? localStorage.getItem("hi_rider_auth_token")
      : null;
  if (authToken && !headers.has("Authorization")) {
    headers.set("Authorization", authToken);
  }
  const response = await fetch(`${apiPrefix}/api${path}`, { ...init, headers });
  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const message = contentType.includes("json")
      ? await response
          .json()
          .then((body) => body.message ?? body.detail ?? body.error ?? JSON.stringify(body))
          .catch(() => "")
      : await response.text().catch(() => "");
    throw new ApiError(message || `Backend request failed (${response.status})`, response.status);
  }
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json() as Promise<T>;
  return (await response.text()) as T;
}

export type BackendRefs = {
  jobId?: number;
  vehicleId?: number;
  customerId?: number;
  inventoryCardId?: number;
  quotationId?: number;
  jobCardId?: number;
  requisitionId?: number;
  inspectionId?: number;
  repairPlanId?: number;
  invoiceId?: number;
  handoverId?: number;
};

export type BackendIntakeResponse = {
  [field: string]: unknown;
  jobId: number;
  jobNumber: string;
  customerId: number;
  customerName: string;
  vehicleId: number;
  registrationNumber: string;
  inventoryCardId: number;
  jobStatus: string;
  intakeStatus: string;
  dateReceived: string;
};

export const requiredId = (name: string, value: string | undefined) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    console.warn(`Missing ${name} configuration`);
    throw new Error("Saving is not available yet. Please try again later.");
  }
  return id;
};

export const configuredCompanyId = () =>
  requiredId("VITE_COMPANY_ID", import.meta.env["VITE_COMPANY_ID"]);
const companyId = configuredCompanyId;
const workshopId = () => requiredId("VITE_WORKSHOP_ID", import.meta.env["VITE_WORKSHOP_ID"]);
const userId = () => requiredId("VITE_USER_ID", import.meta.env["VITE_USER_ID"]);
const employeeId = () => requiredId("VITE_EMPLOYEE_ID", import.meta.env["VITE_EMPLOYEE_ID"]);

export function toCreateVehicleRequest(vehicle: Vehicle) {
  const name = vehicle.customer.trim().split(/\s+/);
  return {
    companyId: companyId(),
    workshopId: workshopId(),
    createdByUserId: userId(),
    receivedByEmployeeId: employeeId(),
    customer: {
      customerType: "INDIVIDUAL",
      firstName: name[0] ?? vehicle.customer,
      lastName: name.slice(1).join(" "),
      phone: vehicle.phone,
      email: vehicle.email || null,
    },
    vehicle: {
      registrationNumber: vehicle.plate,
      make: vehicle.make,
      color: vehicle.color || null,
      vin: vehicle.vin || null,
      vehicleType: "4x4",
    },
    broughtInByName: vehicle.customer,
    broughtInByPhone: vehicle.phone,
    priority: "NORMAL",
    reportedProblem: vehicle.complaints,
    odometerReadingIn: vehicle.odometer ?? null,
    workRequested: vehicle.complaints,
    customerComplaints: vehicle.complaints,
    generalRemarks: vehicle.damage,
  };
}

export function mapVehicleResponse(response: BackendIntakeResponse, previous: Vehicle): Vehicle {
  return {
    ...previous,
    id: response.jobNumber || String(response.jobId),
    plate: response.registrationNumber || previous.plate,
    customer: response.customerName || previous.customer,
    received: response.dateReceived
      ? new Date(response.dateReceived).toLocaleDateString("en-GB")
      : previous.received,
  };
}

export function toCreateQuotationRequest(quotation: Quotation, part?: CatalogPart) {
  const items: NonNullable<Quotation["items"]> = quotation.items?.length
    ? quotation.items
    : [
        {
          itemType: quotation.catalogPartId ? ("PART" as const) : ("LABOUR" as const),
          item: part?.name ?? quotation.description,
          description: quotation.description,
          quantity: quotation.quantity ?? 1,
          unitPrice: quotation.catalogPartId
            ? quotation.amount / (quotation.quantity ?? 1)
            : quotation.amount,
        },
      ];
  return {
    preparedByEmployeeId: employeeId(),
    foremanNotes: quotation.paperFields
      ? `PAPER_QUOTATION:${JSON.stringify(quotation.paperFields)}`
      : undefined,
    items: items.map((item) => ({
      itemType: item.itemType,
      itemCode: item.item || null,
      description: item.description,
      quantity: item.quantity,
      unitOfMeasure: item.itemType === "LABOUR" ? "JOB" : "UNIT",
      unitPrice: item.unitPrice,
    })),
  };
}

export function mapQuotationResponse(
  response: Record<string, unknown>,
  previous: Quotation,
): Quotation {
  const total = Number(response["totalAmount"] ?? previous.amount);
  const subtotal = Number(response["subtotal"] ?? previous.subtotal ?? previous.amount);
  const taxAmount = Number(response["taxAmount"] ?? previous.taxAmount ?? 0);
  const responseItems = Array.isArray(response["items"])
    ? (response["items"] as Record<string, unknown>[])
    : null;
  const quotationDate =
    String(response["issueDate"] ?? response["createdAt"] ?? "") || previous.quotationDate;
  const preparedByName =
    String(response["preparedByName"] ?? previous.preparedByName ?? "") || undefined;
  const notes = String(response["foremanNotes"] ?? "");
  const paperMetadata = notes.startsWith("PAPER_QUOTATION:")
    ? (() => {
        try {
          const value: unknown = JSON.parse(notes.slice("PAPER_QUOTATION:".length));
          return value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, string>)
            : undefined;
        } catch {
          return undefined;
        }
      })()
    : undefined;
  const backendId = Number(response["quotationId"] ?? previous.backendId);
  const status = String(response["quotationStatus"] ?? "DRAFT").toUpperCase();
  return {
    ...previous,
    ...(Number.isSafeInteger(backendId) && backendId > 0 ? { backendId } : {}),
    id: String(response["quotationNumber"] ?? response["quotationId"] ?? previous.id),
    amount: Number.isFinite(total) ? total : previous.amount,
    subtotal: Number.isFinite(subtotal) ? subtotal : previous.amount,
    taxAmount: Number.isFinite(taxAmount) ? taxAmount : 0,
    discountAmount: Number(response["discountAmount"] ?? 0),
    ...(quotationDate ? { quotationDate } : {}),
    ...(preparedByName ? { preparedByName } : {}),
    ...(paperMetadata ? { paperFields: paperMetadata } : {}),
    ...(responseItems
      ? {
          items: responseItems.map((item) => ({
            itemType: String(item["itemType"] ?? "OTHER").toUpperCase() as
              "PART" | "LABOUR" | "SERVICE" | "OTHER",
            item: String(item["itemCode"] ?? ""),
            description: String(item["description"] ?? ""),
            quantity: Number(item["quantity"] ?? 0),
            unitPrice: Number(item["unitPrice"] ?? 0),
            discountAmount: Number(item["discountAmount"] ?? 0),
            lineTotal:
              Number(item["quantity"] ?? 0) * Number(item["unitPrice"] ?? 0) -
              Number(item["discountAmount"] ?? 0),
            taxAmount: Number(item["taxAmount"] ?? 0),
          })),
        }
      : {}),
    status:
      status === "APPROVED"
        ? "Approved"
        : status === "ISSUED" || status === "PENDING_APPROVAL"
          ? "Awaiting approval"
          : "Draft",
  };
}

export function toCreateJobCardRequest(job: JobCard, refs: BackendRefs) {
  if (!refs.jobId || !refs.quotationId) {
    throw new Error("A backend job and quotation are required before creating a job card.");
  }
  return {
    jobId: refs.jobId,
    quotationId: refs.quotationId,
    preparedByEmployeeId: job.preparedByEmployeeId ?? employeeId(),
    workDescription: job.work,
    repairInstructions: job.work,
    foremanRemarks: job.remarks
      ? `Department: ${job.department} · ${job.remarks}`
      : `Department: ${job.department}`,
  };
}

export function toCreateRequisitionRequest(requisition: Requisition) {
  return {
    requestedByEmployeeId: employeeId(),
    priority: "NORMAL",
    purpose: `${requisition.part} x ${requisition.quantity}: ${requisition.reason}`,
  };
}

export function toStartInspectionRequest() {
  return { inspectorEmployeeId: employeeId() };
}

export function mapInventoryResponse(
  response: Record<string, unknown>,
  previous: InventoryCard,
): InventoryCard {
  return {
    ...previous,
    id: String(response["inventoryCardId"] ?? response["id"] ?? previous.id),
  };
}

export function mapJobCardResponse(response: Record<string, unknown>, previous: JobCard): JobCard {
  return {
    ...previous,
    id: String(response["jobCardNumber"] ?? response["jobCardId"] ?? response["id"] ?? previous.id),
  };
}

export function mapRequisitionResponse(
  response: Record<string, unknown>,
  previous: Requisition,
): Requisition {
  const status = String(
    response["status"] ?? response["requisitionStatus"] ?? "PENDING",
  ).toUpperCase();
  return {
    ...previous,
    id: String(response["requisitionNumber"] ?? response["requisitionId"] ?? previous.id),
    status:
      status === "APPROVED"
        ? "Approved"
        : status === "REJECTED"
          ? "Rejected"
          : status === "ORDERED"
            ? "Ordered"
            : status === "DISPATCHED"
              ? "Dispatched"
              : "Pending",
  };
}

export function mapInspectionResponse(
  response: Record<string, unknown>,
  previous: Inspection,
): Inspection {
  const decision = String(
    response["inspectionDecision"] ?? response["inspectionStatus"] ?? "",
  ).toUpperCase();
  return {
    ...previous,
    id: String(response["inspectionNumber"] ?? response["inspectionId"] ?? previous.id),
    result:
      decision.includes("REWORK") || decision.includes("FAIL")
        ? "Rework required"
        : previous.result,
  };
}

export const backendApi = {
  getCompanySettings: () => apiFetch<Record<string, unknown>>(`/companies/${companyId()}/settings`),
  loadRecords: async () => {
    const company = companyId();
    const [
      vehicles,
      jobCards,
      requisitions,
      inspections,
      inventory,
      parts,
      purchaseOrders,
      options,
    ] = await Promise.all([
      apiFetch<Record<string, unknown>[]>(`/companies/${company}/vehicles`),
      apiFetch<Record<string, unknown>[]>(`/companies/${company}/job-cards`),
      apiFetch<Record<string, unknown>[]>(`/companies/${company}/parts/requisitions`),
      apiFetch<Record<string, unknown>[]>(`/companies/${company}/final-inspections`),
      apiFetch<Record<string, unknown>[]>(`/companies/${company}/inventory-cards`),
      apiFetch<Record<string, unknown>[]>(`/companies/${company}/parts`),
      apiFetch<Record<string, unknown>[]>(`/companies/${company}/purchase-orders`),
      apiFetch<Record<string, unknown>>(
        `/companies/${company}/workflow-options?workshopId=${workshopId()}`,
      ),
    ]);
    const quotesByJob = await Promise.all(
      vehicles
        .filter((v) => v["jobId"])
        .map(async (v) => {
          const quotes = await apiFetch<Record<string, unknown>[]>(
            `/jobs/${v["jobId"]}/quotations`,
          );
          return [Number(v["jobId"]), quotes] as const;
        }),
    );
    const approvalsByQuote = await Promise.all(
      quotesByJob.flatMap(([, quotes]) =>
        quotes.map(async (q) => {
          const quoteId = Number(q["quotationId"]);
          const approvals = await apiFetch<Record<string, unknown>[]>(
            `/quotations/${quoteId}/approvals`,
          );
          return [quoteId, approvals[0]] as const;
        }),
      ),
    );
    const workflows = await Promise.all(
      jobCards
        .filter((card) => card["repairPlanId"])
        .map(async (card) =>
          apiFetch<Record<string, unknown>>(
            `/companies/${company}/repair-plans/${card["repairPlanId"]}/workflow`,
          ),
        ),
    );
    const inspectionDetails = await Promise.all(
      inspections.map(async (item) => {
        const id = Number(item["inspectionId"]);
        const [details, signoffs] = await Promise.all([
          apiFetch<Record<string, unknown>>(`/final-inspections/${id}`),
          apiFetch<Record<string, unknown>>(`/final-inspections/${id}/signoffs`),
        ]);
        return [id, { details, signoffs }] as const;
      }),
    );
    const dispatchesByJob = await Promise.all(
      vehicles
        .filter((v) => v["jobId"])
        .map(
          async (v) =>
            [
              Number(v["jobId"]),
              await apiFetch<Record<string, unknown>[]>(`/dispatch-orders/jobs/${v["jobId"]}`),
            ] as const,
        ),
    );
    const invoicesByJob = await Promise.all(
      vehicles
        .filter((v) => v["jobId"])
        .map(
          async (v) =>
            [
              Number(v["jobId"]),
              await apiFetch<Record<string, unknown>[]>(`/invoices/job/${v["jobId"]}`),
            ] as const,
        ),
    );
    const handoversByJob = await Promise.all(
      vehicles
        .filter((v) => v["jobId"])
        .map(async (v) => {
          const jobId = Number(v["jobId"]);
          const handover = await apiFetch<Record<string, unknown>>(`/handovers/job/${jobId}`).catch(
            () => null,
          );
          return [jobId, handover] as const;
        }),
    );
    return {
      vehicles,
      jobCards,
      requisitions,
      inspections,
      inventory,
      parts,
      purchaseOrders,
      options,
      workflows,
      inspectionDetails: new Map(inspectionDetails),
      dispatchesByJob: new Map(dispatchesByJob),
      invoicesByJob: new Map(invoicesByJob),
      handoversByJob: new Map(handoversByJob),
      quotesByJob: new Map(quotesByJob),
      approvalsByQuote: new Map(approvalsByQuote),
    };
  },
  getJobCard: (jobCardId: number) =>
    apiFetch<Record<string, unknown>>(`/companies/${companyId()}/job-cards/${jobCardId}`),
  acceptRepairPlan: (repairPlanId: number, actorId = employeeId()) =>
    apiFetch<Record<string, unknown>>(`/repair-plans/${repairPlanId}/accept`, {
      method: "POST",
      body: JSON.stringify({ foremanEmployeeId: actorId }),
    }),
  assignWorkOrder: (
    workOrderId: number,
    assignedEmployeeId: number,
    role: string,
    actorId = employeeId(),
  ) =>
    apiFetch<Record<string, unknown>>("/work-order-assignments/batch", {
      method: "POST",
      body: JSON.stringify({
        assignedByEmployeeId: actorId,
        workOrders: [
          { workOrderId, assignments: [{ employeeId: assignedEmployeeId, assignmentRole: role }] },
        ],
      }),
    }),
  workOrderAction: (
    workOrderId: number,
    action: "start" | "pause" | "resume" | "waiting",
    notes: string,
    actorId = employeeId(),
  ) =>
    apiFetch<Record<string, unknown>>(`/work-orders/${workOrderId}/${action}`, {
      method: "POST",
      body: JSON.stringify({ employeeId: actorId, notes }),
    }),
  arriveAtDepartment: (
    workOrderId: number,
    departmentId: number,
    arrivalNotes: string,
    actorId = employeeId(),
  ) =>
    apiFetch<Record<string, unknown>>(
      `/work-orders/${workOrderId}/departments/${departmentId}/arrivals`,
      { method: "POST", body: JSON.stringify({ employeeId: actorId, arrivalNotes }) },
    ),
  sendOffDepartment: (
    workOrderId: number,
    departmentId: number,
    visitId: number,
    sendOffNotes: string,
    actorId = employeeId(),
  ) =>
    apiFetch<Record<string, unknown>>(
      `/work-orders/${workOrderId}/departments/${departmentId}/visits/${visitId}/send-off`,
      { method: "POST", body: JSON.stringify({ employeeId: actorId, sendOffNotes }) },
    ),
  submitWorkOrder: (workOrderId: number, completionNotes: string, actorId = employeeId()) =>
    apiFetch<Record<string, unknown>>(`/work-orders/${workOrderId}/submit-completion`, {
      method: "POST",
      body: JSON.stringify({ employeeId: actorId, completionNotes }),
    }),
  confirmWorkOrder: (workOrderId: number, reason: string, actorId = employeeId()) =>
    apiFetch<Record<string, unknown>>(`/work-orders/${workOrderId}/confirm`, {
      method: "POST",
      body: JSON.stringify({ employeeId: actorId, decision: "COMPLETED", reason }),
    }),
  uploadWorkEvidence: (
    workOrderId: number,
    file: File,
    caption: string,
    actorId = employeeId(),
  ) => {
    const body = new FormData();
    body.set("employeeId", String(actorId));
    body.set("evidenceType", "PHOTO");
    body.set("caption", caption);
    body.set("file", file);
    return apiFetch<Record<string, unknown>>(`/work-orders/${workOrderId}/evidence`, {
      method: "POST",
      body,
    });
  },
  updateInspectionItem: (
    inspectionId: number,
    itemId: number,
    checkStatus: "PASS" | "FAIL",
    comments: string,
    responsibleDepartmentId?: number,
  ) =>
    apiFetch<Record<string, unknown>>(`/final-inspections/${inspectionId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({
        employeeId: employeeId(),
        checkStatus,
        comments,
        responsibleDepartmentId,
      }),
    }),
  signoffInspectionDepartment: (inspectionId: number, departmentId: number, signoffNotes: string) =>
    apiFetch<Record<string, unknown>>(
      `/final-inspections/${inspectionId}/departments/${departmentId}/signoff`,
      {
        method: "POST",
        body: JSON.stringify({ employeeId: employeeId(), signoffStatus: "APPROVED", signoffNotes }),
      },
    ),
  completeInspection: (inspectionId: number) =>
    apiFetch<Record<string, unknown>>(`/final-inspections/${inspectionId}/complete`, {
      method: "POST",
    }),
  createCorrectiveWorkOrders: (inspectionId: number) =>
    apiFetch<Record<string, unknown>>(`/final-inspections/${inspectionId}/corrective-work-orders`, {
      method: "POST",
      body: JSON.stringify({ employeeId: employeeId() }),
    }),
  createPurchaseOrder: (
    requisitionId: number,
    supplierId: number,
    items: Array<{ requisitionItemId: number; quantityOrdered: number; unitPrice: number }>,
    supplierReference?: string,
  ) =>
    apiFetch<Record<string, unknown>>(`/parts/requisitions/${requisitionId}/purchase-orders`, {
      method: "POST",
      body: JSON.stringify({
        supplierId,
        createdByEmployeeId: employeeId(),
        supplierReference,
        items,
      }),
    }),
  receivePurchaseOrder: (
    purchaseOrderId: number,
    stockLocationId: number,
    items: Array<{
      purchaseOrderItemId: number;
      quantityDelivered: number;
      quantityAccepted: number;
    }>,
    supplierDeliveryReference?: string,
  ) =>
    apiFetch<Record<string, unknown>>(`/parts/purchase-orders/${purchaseOrderId}/receipts`, {
      method: "POST",
      body: JSON.stringify({
        receivedByEmployeeId: employeeId(),
        stockLocationId,
        supplierDeliveryReference,
        items,
      }),
    }),
  checkPartsAvailability: (jobCardId: number) =>
    apiFetch<Record<string, unknown>>(`/job-cards/${jobCardId}/parts/availability`),
  reservePart: (
    jobCardId: number,
    jobCardPartId: number,
    stockLocationId: number,
    quantity: number,
  ) =>
    apiFetch<Record<string, unknown>>(
      `/job-cards/${jobCardId}/parts/${jobCardPartId}/reservations`,
      {
        method: "POST",
        body: JSON.stringify({ reservedByEmployeeId: employeeId(), stockLocationId, quantity }),
      },
    ),
  createDispatch: (
    jobId: number,
    mechanicId: number,
    departmentId: number,
    reservationIds: number[],
  ) =>
    apiFetch<Record<string, unknown>>("/dispatch-orders", {
      method: "POST",
      body: JSON.stringify({
        jobId,
        createdByEmployeeId: employeeId(),
        assignedMechanicEmployeeId: mechanicId,
        departmentId,
        items: reservationIds.map((stockReservationId) => ({ stockReservationId })),
      }),
    }),
  dispatchAction: (
    dispatchId: number,
    action: "approve" | "issue" | "receive",
    body: Record<string, unknown>,
  ) =>
    apiFetch<Record<string, unknown>>(`/dispatch-orders/${dispatchId}/${action}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  createInvoice: (jobId: number, quotationId: number) =>
    apiFetch<Record<string, unknown>>("/invoices", {
      method: "POST",
      body: JSON.stringify({ jobId, quotationId, issuedByEmployeeId: employeeId() }),
    }),
  recordPayment: (invoiceId: number, amount: number, transactionReference: string) =>
    apiFetch<Record<string, unknown>>(`/invoices/${invoiceId}/payments`, {
      method: "POST",
      body: JSON.stringify({
        receivedByEmployeeId: employeeId(),
        paymentMethod: "CASH",
        amount,
        transactionReference,
        paymentDate: new Date().toISOString(),
      }),
    }),
  createHandover: (input: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>("/handovers", {
      method: "POST",
      body: JSON.stringify({ ...input, releasedByEmployeeId: employeeId() }),
    }),
  viewCustomerApproval: (token: string) =>
    apiFetch<Record<string, unknown>>("/customer/quotation-approvals/view", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  submitCustomerApproval: (
    token: string,
    decisions: Array<{ quotationItemId: number; decision: "APPROVED" | "REJECTED" }>,
    customerComments?: string,
  ) =>
    apiFetch<Record<string, unknown>>("/customer/quotation-approvals/submit", {
      method: "POST",
      body: JSON.stringify({ token, decisions, customerComments }),
    }),
  createIntake: (vehicle: Vehicle) =>
    apiFetch<BackendIntakeResponse>("/intake/vehicles", {
      method: "POST",
      body: JSON.stringify(toCreateVehicleRequest(vehicle)),
    }),
  createQuotation: (jobId: number, quotation: Quotation, part?: CatalogPart) =>
    apiFetch<Record<string, unknown>>(`/jobs/${jobId}/quotations`, {
      method: "POST",
      body: JSON.stringify(toCreateQuotationRequest(quotation, part)),
    }),
  issueQuotation: (quotationId: number) =>
    apiFetch<Record<string, unknown>>(`/quotations/${quotationId}/issue`, { method: "PUT" }),
  requestQuotationApproval: (quotationId: number) =>
    apiFetch<Record<string, unknown>>(`/quotations/${quotationId}/verify-and-request-approval`, {
      method: "POST",
      body: JSON.stringify({ verifiedByEmployeeId: employeeId(), notificationChannel: "SMS" }),
    }),
  createJobCard: (job: JobCard, refs: BackendRefs) =>
    apiFetch<Record<string, unknown>>("/job-cards", {
      method: "POST",
      body: JSON.stringify(toCreateJobCardRequest(job, refs)),
    }),
  linkJobCardPart: (jobCardId: number, jobCardPartId: number, partId: number) =>
    apiFetch<Record<string, unknown>>(
      `/job-cards/${jobCardId}/parts/${jobCardPartId}/catalog-part`,
      {
        method: "PATCH",
        body: JSON.stringify({ partId, linkedByEmployeeId: employeeId() }),
      },
    ),
  createRequisition: (jobId: number, requisition: Requisition) =>
    apiFetch<Record<string, unknown>>(`/jobs/${jobId}/parts/requisitions`, {
      method: "POST",
      body: JSON.stringify(toCreateRequisitionRequest(requisition)),
    }),
  startFinalInspection: (jobId: number) =>
    apiFetch<Record<string, unknown>>(`/final-inspections/jobs/${jobId}`, {
      method: "POST",
      body: JSON.stringify(toStartInspectionRequest()),
    }),
};
