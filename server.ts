import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

interface ChatHistoryItem {
  role: "user" | "model";
  text: string;
}

interface ChatRequestBody {
  message?: unknown;
  history?: unknown;
  context?: unknown;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_MODEL = "gemini-4-hydrogen";

function parseHistory(raw: unknown): ChatHistoryItem[] {
  if (!Array.isArray(raw)) return [];
  const items: ChatHistoryItem[] = [];
  for (const entry of raw.slice(-12)) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const role = record["role"] === "model" ? "model" : record["role"] === "user" ? "user" : null;
    const text = typeof record["text"] === "string" ? record["text"].trim() : "";
    if (role && text) {
      items.push({ role, text: text.slice(0, 2000) });
    }
  }
  return items;
}

function buildSystemInstruction(workshopContext: string): string {
  const base = [
    "You are the AI Assistant inside Hi Rider 4x4 World, an automotive workshop management system.",
    "Help workshop foremen, managers, directors, and mechanics with job cards, repair diagnostics, parts requisitions, quotations, final QA inspections, and workflow stages.",
    "Keep responses concise, practical, and structured with short bullet points or checklists when helpful so they read cleanly inside a 400px right-side chat panel.",
    "Do not invent specific customer records or job card IDs that are not present in the live workshop context below.",
  ].join(" ");

  if (!workshopContext) {
    return base;
  }

  return `${base}\n\nLive Workshop Context:\n${workshopContext.slice(0, 3000)}`;
}

function extractGeminiError(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err ?? "Unknown error");
  const normalized = rawMessage.toUpperCase();

  if (
    normalized.includes("API_KEY_INVALID") ||
    normalized.includes("API KEY NOT VALID") ||
    normalized.includes("400")
  ) {
    return {
      status: 400,
      message:
        "The configured Gemini API key appears invalid. Please verify your API key in Settings > Secrets.",
    };
  }
  if (normalized.includes("PERMISSION_DENIED") || normalized.includes("403")) {
    return {
      status: 403,
      message:
        "Gemini API access was denied for the current key. Please check your API key in Settings > Secrets.",
    };
  }
  if (normalized.includes("RESOURCE_EXHAUSTED") || normalized.includes("429")) {
    return {
      status: 429,
      message:
        "Gemini API rate limit or quota reached. Please wait a moment and try again, or check your plan in Settings > Secrets.",
    };
  }
  if (normalized.includes("NOT_FOUND") || normalized.includes("404")) {
    return {
      status: 404,
      message: "The requested Gemini model endpoint was not found.",
    };
  }

  return {
    status: 502,
    message: "Unable to reach the AI assistant right now. Please try again in a moment.",
  };
}

async function startServer() {
  const app = express();
  const port = Number(process.env["PORT"] || 3000);
  const isProd = process.env["NODE_ENV"] === "production";

  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/ai/chat", async (req, res) => {
    const body = (req.body ?? {}) as ChatRequestBody;
    const rawMessage = typeof body.message === "string" ? body.message.trim() : "";

    if (!rawMessage) {
      res.status(400).json({ error: "Please enter a question or message for the AI Assistant." });
      return;
    }

    if (rawMessage.length > 2000) {
      res.status(400).json({ error: "Message is too long (maximum 2,000 characters)." });
      return;
    }

    const apiKey = process.env["GEMINI_API_KEY"]?.trim();
    if (!apiKey) {
      res.status(503).json({
        error:
          "AI Assistant is waiting for a Gemini API key. Please check your key in the Settings > Secrets panel.",
      });
      return;
    }

    const history = parseHistory(body.history);
    const contextSummary = typeof body.context === "string" ? body.context.trim() : "";

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const contents = [
        ...history.map((item) => ({
          role: item.role,
          parts: [{ text: item.text }],
        })),
        {
          role: "user" as const,
          parts: [{ text: rawMessage }],
        },
      ];

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents,
        config: {
          systemInstruction: buildSystemInstruction(contextSummary),
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        res.status(502).json({
          error: "The AI Assistant returned an empty response. Please try rephrasing your query.",
        });
        return;
      }

      res.json({ reply });
    } catch (err) {
      const mapped = extractGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.use((_req, res) => {
      const indexHtml = path.join(distDir, "index.html");
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send("Application build not found. Run npm run build first.");
      }
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
