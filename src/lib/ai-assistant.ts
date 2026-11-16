import type { JobCard, Requisition, Vehicle, WorkspaceRole } from "./workshop";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface AiApiHistoryItem {
  role: "user" | "model";
  text: string;
}

export interface AiQuickPrompt {
  id: string;
  label: string;
  prompt: string;
  category: "job-card" | "parts" | "workflow" | "overview";
}

export const AI_MAX_MESSAGE_LENGTH = 2000;

export const AI_QUICK_PROMPTS: readonly AiQuickPrompt[] = [
  {
    id: "job-card-help",
    label: "Help with job card",
    prompt:
      "Help me draft a clear job card work description, estimated tasks, and technician checklist for a vehicle in repair.",
    category: "job-card",
  },
  {
    id: "active-jobs-summary",
    label: "Active job cards",
    prompt:
      "Summarize our active job cards, current repair statuses, and which jobs need immediate follow-up.",
    category: "overview",
  },
  {
    id: "pending-parts",
    label: "Pending parts check",
    prompt:
      "Review our pending parts requisitions and tell me which jobs could be delayed waiting for parts approval.",
    category: "parts",
  },
  {
    id: "qa-checklist",
    label: "QA sign-off checklist",
    prompt:
      "Provide a concise final inspection and road-test sign-off checklist before releasing a 4x4 vehicle.",
    category: "workflow",
  },
];

export function validateAiChatMessage(
  raw: string,
): { valid: true; text: string } | { valid: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, error: "Please enter a message before sending." };
  }
  if (trimmed.length > AI_MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message must be ${AI_MAX_MESSAGE_LENGTH} characters or fewer.`,
    };
  }
  return { valid: true, text: trimmed };
}

export function formatHistoryForApi(
  messages: readonly AiChatMessage[],
  maxItems = 12,
): AiApiHistoryItem[] {
  return messages
    .filter((msg) => msg.text.trim().length > 0)
    .slice(-maxItems)
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      text: msg.text.trim(),
    }));
}

export function buildWorkshopContextSummary(params: {
  role: WorkspaceRole;
  department?: string;
  vehicles: readonly Vehicle[];
  jobs: readonly JobCard[];
  requisitions: readonly Requisition[];
}): string {
  const { role, department, vehicles, jobs, requisitions } = params;
  const activeJobs = jobs.filter(
    (job) => !["completed", "complete"].includes(job.status.trim().toLowerCase()),
  );
  const completedCount = jobs.length - activeJobs.length;
  const pendingReqs = requisitions.filter((req) => req.status === "Pending");

  const vehicleLookup = new Map<string, Vehicle>();
  for (const vehicle of vehicles) {
    vehicleLookup.set(vehicle.id, vehicle);
  }

  const lines: string[] = [
    `User Role: ${role}${role === "Employee" && department ? ` (${department})` : ""}`,
    `Vehicles in workshop: ${vehicles.length}`,
    `Job cards: ${jobs.length} total (${activeJobs.length} active, ${completedCount} completed)`,
    `Pending parts requisitions: ${pendingReqs.length}`,
  ];

  if (activeJobs.length > 0) {
    lines.push("Active Job Cards:");
    for (const job of activeJobs.slice(0, 6)) {
      const vehicle = vehicleLookup.get(job.vehicleId);
      const vehicleInfo = vehicle
        ? `${vehicle.make || "Vehicle"} (${vehicle.plate || vehicle.id})`
        : job.vehicleId || "Unlinked vehicle";
      const workSnippet = job.work.trim().slice(0, 120) || "No description";
      lines.push(
        `- ${job.id} | ${vehicleInfo} | ${job.department} | ${job.status}: ${workSnippet}`,
      );
    }
  }

  if (pendingReqs.length > 0) {
    lines.push("Pending Parts Requisitions:");
    for (const req of pendingReqs.slice(0, 5)) {
      lines.push(
        `- ${req.id} (${req.department}): ${req.part || "Parts"} x${req.quantity} — ${req.reason || "No reason"}`,
      );
    }
  }

  return lines.join("\n");
}

export function formatAssistantTimestamp(date: Date = new Date()): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export type InlineSegment =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "code"; text: string };

export type MessageBlock =
  | { type: "paragraph"; segments: InlineSegment[] }
  | { type: "heading"; segments: InlineSegment[] }
  | { type: "list"; items: InlineSegment[][] }
  | { type: "divider" };

export function parseInlineSegments(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      segments.push({ type: "strong", text: token.slice(2, -2) });
    } else if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      segments.push({ type: "code", text: token.slice(1, -1) });
    } else {
      segments.push({ type: "text", text: token });
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", text: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", text }];
}

export function parseAssistantBlocks(raw: string): MessageBlock[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: MessageBlock[] = [];
  let listItems: InlineSegment[][] = [];
  let paragraphLines: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        segments: parseInlineSegments(paragraphLines.join(" ")),
      });
      paragraphLines = [];
    }
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      flushList();
      flushParagraph();
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushList();
      flushParagraph();
      blocks.push({ type: "divider" });
      continue;
    }

    const headingMatch = /^#{1,4}\s+(.+)$/.exec(trimmed);
    if (headingMatch?.[1]) {
      flushList();
      flushParagraph();
      blocks.push({ type: "heading", segments: parseInlineSegments(headingMatch[1]) });
      continue;
    }

    const listMatch = /^(?:[-*]|\d+\.)\s+(.+)$/.exec(trimmed);
    if (listMatch?.[1]) {
      flushParagraph();
      listItems.push(parseInlineSegments(listMatch[1]));
      continue;
    }

    flushList();
    paragraphLines.push(trimmed);
  }

  flushList();
  flushParagraph();

  return blocks;
}
