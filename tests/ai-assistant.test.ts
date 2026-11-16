import test from "node:test";
import assert from "node:assert/strict";
import {
  AI_MAX_MESSAGE_LENGTH,
  AI_QUICK_PROMPTS,
  buildWorkshopContextSummary,
  formatHistoryForApi,
  parseAssistantBlocks,
  parseInlineSegments,
  validateAiChatMessage,
  type AiChatMessage,
} from "../src/lib/ai-assistant";
import type { JobCard, Requisition, Vehicle } from "../src/lib/workshop";

test("AI_QUICK_PROMPTS provides job card and workshop quick queries", () => {
  assert.ok(AI_QUICK_PROMPTS.length >= 3);
  const jobCardPrompt = AI_QUICK_PROMPTS.find((item) => item.category === "job-card");
  assert.ok(jobCardPrompt, "Expected a job-card quick prompt");
  assert.ok(jobCardPrompt.label.length > 0);
  assert.ok(jobCardPrompt.prompt.length > 10);
});

test("validateAiChatMessage trims valid messages and rejects empty or oversized input", () => {
  assert.deepEqual(validateAiChatMessage("   "), {
    valid: false,
    error: "Please enter a message before sending.",
  });

  const tooLong = "x".repeat(AI_MAX_MESSAGE_LENGTH + 1);
  const overLimit = validateAiChatMessage(tooLong);
  assert.equal(overLimit.valid, false);

  const ok = validateAiChatMessage("  Check job card JC-101 status  ");
  assert.deepEqual(ok, {
    valid: true,
    text: "Check job card JC-101 status",
  });
});

test("formatHistoryForApi maps assistant to model, skips blanks, and caps items", () => {
  const messages: AiChatMessage[] = Array.from({ length: 15 }, (_, idx) => ({
    id: `m-${idx}`,
    role: idx % 2 === 0 ? "user" : "assistant",
    text: idx === 0 ? "   " : `Message ${idx}`,
    timestamp: "09:00",
  }));

  const formatted = formatHistoryForApi(messages, 4);
  assert.equal(formatted.length, 4);
  assert.deepEqual(formatted[0], { role: "model", text: "Message 11" });
  assert.deepEqual(formatted[1], { role: "user", text: "Message 12" });
  assert.deepEqual(formatted[2], { role: "model", text: "Message 13" });
  assert.deepEqual(formatted[3], { role: "user", text: "Message 14" });
});

test("buildWorkshopContextSummary summarizes role, active job cards, and pending parts", () => {
  const vehicles: Vehicle[] = [
    {
      id: "VR-1",
      plate: "BAK 6213",
      make: "Ford Ranger",
      customer: "John Banda",
      phone: "0977000111",
      email: "john@example.com",
      received: "01/05/2025",
      stage: 5,
      department: "Mechanical",
      foreman: "Foreman 01",
      complaints: "Suspension knock",
      damage: "Front bush worn",
      due: "2025-05-10",
      progress: 40,
    },
  ];
  const jobs: JobCard[] = [
    {
      id: "JC-881",
      vehicleId: "VR-1",
      department: "Mechanical",
      work: "Replace front upper control arm bushes and align wheels",
      status: "In Repair",
      due: "2025-05-10",
    },
    {
      id: "JC-880",
      vehicleId: "VR-1",
      department: "Painting",
      work: "Touch-up rear bumper",
      status: "Completed",
      due: "2025-05-05",
    },
  ];
  const requisitions: Requisition[] = [
    {
      id: "REQ-42",
      vehicleId: "VR-1",
      part: "Upper Control Arm Bush Kit",
      quantity: 2,
      department: "Mechanical",
      reason: "Worn front suspension",
      amount: 1450,
      foreman: "Foreman 01",
      status: "Pending",
      date: "2025-05-06",
    },
  ];

  const summary = buildWorkshopContextSummary({
    role: "Foreman",
    vehicles,
    jobs,
    requisitions,
  });

  assert.match(summary, /User Role: Foreman/);
  assert.match(summary, /1 active, 1 completed/);
  assert.match(summary, /Pending parts requisitions: 1/);
  assert.match(summary, /JC-881 \| Ford Ranger \(BAK 6213\) \| Mechanical \| In Repair/);
  assert.match(summary, /REQ-42 \(Mechanical\): Upper Control Arm Bush Kit x2/);
});

test("parseInlineSegments and parseAssistantBlocks convert markdown formatting into structured blocks", () => {
  const inline = parseInlineSegments("Check **Pending Parts:** `0` items");
  assert.deepEqual(inline, [
    { type: "text", text: "Check " },
    { type: "strong", text: "Pending Parts:" },
    { type: "text", text: " " },
    { type: "code", text: "0" },
    { type: "text", text: " items" },
  ]);

  const blocks = parseAssistantBlocks(
    "### Job Card Checklist\n\n* **Inspect brakes** (`JC-881`)\n* Torque lug nuts\n\n---\n\nReady for release.",
  );
  assert.equal(blocks.length, 4);
  assert.equal(blocks[0]?.type, "heading");
  assert.equal(blocks[1]?.type, "list");
  assert.equal(blocks[2]?.type, "divider");
  assert.equal(blocks[3]?.type, "paragraph");
});
