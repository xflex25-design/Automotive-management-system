import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Loader2, RotateCcw, Send, X } from "./fa-icons";
import { useWorkspace } from "./workspace-context";
import {
  AI_MAX_MESSAGE_LENGTH,
  buildWorkshopContextSummary,
  formatAssistantTimestamp,
  formatHistoryForApi,
  parseAssistantBlocks,
  validateAiChatMessage,
  type AiChatMessage,
  type InlineSegment,
} from "@/lib/ai-assistant";
import { cn } from "@/lib/utils";

const HUBOT_ICON_SRC = "/assets/aistudio/hubot-svgrepo-com_394bbc53.svg";

function renderInlineSegments(segments: InlineSegment[]) {
  return segments.map((seg, idx) => {
    if (seg.type === "strong") {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {seg.text}
        </strong>
      );
    }
    if (seg.type === "code") {
      return (
        <code
          key={idx}
          className="rounded bg-background/80 px-1 py-0.5 font-mono text-xs font-medium text-foreground border border-border/60"
        >
          {seg.text}
        </code>
      );
    }
    return <span key={idx}>{seg.text}</span>;
  });
}

function AssistantMessageContent({ text }: { text: string }) {
  const blocks = useMemo(() => parseAssistantBlocks(text), [text]);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        if (block.type === "divider") {
          return <hr key={index} className="border-border/70 my-1.5" />;
        }
        if (block.type === "heading") {
          return (
            <div key={index} className="font-semibold text-foreground tracking-normal pt-0.5">
              {renderInlineSegments(block.segments)}
            </div>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc pl-4 space-y-1 text-foreground/95">
              {block.items.map((itemSegments, itemIdx) => (
                <li key={itemIdx}>{renderInlineSegments(itemSegments)}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{renderInlineSegments(block.segments)}</p>;
      })}
    </div>
  );
}

export function AiAssistantPanel() {
  const { role, employeeDepartment, vehicles, jobs, requisitions } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const workshopContext = useMemo(
    () =>
      buildWorkshopContextSummary({
        role,
        department: employeeDepartment,
        vehicles,
        jobs,
        requisitions,
      }),
    [role, employeeDepartment, vehicles, jobs, requisitions],
  );

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  async function submitPrompt(rawText: string, options?: { appendUserMessage?: boolean }) {
    const validation = validateAiChatMessage(rawText);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    const shouldAppendUser = options?.appendUserMessage ?? true;
    const promptText = validation.text;
    const historySnapshot = formatHistoryForApi(messages);

    if (shouldAppendUser) {
      const userMessage: AiChatMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "user",
        text: promptText,
        timestamp: formatAssistantTimestamp(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
    }

    setErrorMessage(null);
    setLastFailedPrompt(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptText,
          history: historySnapshot,
          context: workshopContext,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };

      if (!response.ok || !data.reply) {
        const msg =
          data.error || "Unable to get a response from the AI Assistant. Please try again.";
        setErrorMessage(msg);
        setLastFailedPrompt(promptText);
        return;
      }

      const assistantMessage: AiChatMessage = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        text: data.reply,
        timestamp: formatAssistantTimestamp(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setErrorMessage("Network error while contacting the AI Assistant. Please try again.");
      setLastFailedPrompt(promptText);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    void submitPrompt(input);
  }

  function handleComposerKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        void submitPrompt(input);
      }
    }
  }

  function handleClearChat() {
    setMessages([]);
    setErrorMessage(null);
    setLastFailedPrompt(null);
    inputRef.current?.focus();
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant"
          title="AI Assistant"
          aria-expanded={false}
          aria-controls="ai-assistant-panel"
          className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-150 hover:scale-105 hover:bg-primary/90 hover:shadow-xl active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
        >
          <img
            src={HUBOT_ICON_SRC}
            alt=""
            aria-hidden="true"
            className="h-6 w-6 shrink-0 brightness-0 invert"
          />
        </button>
      )}

      {isOpen && (
        <aside
          id="ai-assistant-panel"
          role="dialog"
          aria-label="AI Assistant"
          aria-modal="false"
          className="fixed top-0 right-0 bottom-0 z-50 flex w-full sm:w-[480px] max-w-full flex-col border-l border-border bg-card text-card-foreground shadow-2xl animate-in slide-in-from-right duration-200"
        >
          {/* Header */}
          <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3.5 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                <img src={HUBOT_ICON_SRC} alt="" aria-hidden="true" className="h-5 w-5 shrink-0" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground leading-tight tracking-normal truncate">
                  AI Assistant
                </h2>
                <p className="text-xs text-muted-foreground truncate tabular-nums">
                  {role} · {jobs.length} job cards · {requisitions.length} requisitions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  aria-label="Clear chat"
                  title="Clear chat"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Collapse AI Assistant"
                title="Collapse AI Assistant"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>
          </header>

          {/* Messages (starts empty) */}
          <div
            data-testid="ai-chat-messages"
            className="flex-1 overflow-y-auto px-5 py-5 space-y-3"
            aria-live="polite"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-1",
                  msg.role === "user" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[88%] rounded-xl px-4 py-3 text-sm leading-relaxed break-words",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm whitespace-pre-wrap"
                      : "border border-border bg-muted/50 text-foreground rounded-bl-sm",
                  )}
                >
                  {msg.role === "assistant" ? (
                    <AssistantMessageContent text={msg.text} />
                  ) : (
                    msg.text
                  )}
                </div>
                <span className="px-1 text-[10px] tabular-nums text-muted-foreground">
                  {msg.role === "user" ? "You" : "AI Assistant"} · {msg.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="inline-flex items-center gap-2 rounded-xl rounded-bl-sm border border-border bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 space-y-2"
              >
                <p className="leading-snug">{errorMessage}</p>
                {lastFailedPrompt && (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      void submitPrompt(lastFailedPrompt, { appendUserMessage: false })
                    }
                    className="inline-flex items-center gap-1.5 rounded border border-red-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    Retry
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <form
            onSubmit={handleFormSubmit}
            className="flex items-end gap-2.5 border-t border-border bg-background p-4 shrink-0"
          >
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleComposerKeyDown}
              maxLength={AI_MAX_MESSAGE_LENGTH}
              placeholder="Ask about job cards, parts, or workflow..."
              aria-label="Ask AI Assistant"
              disabled={isLoading}
              className="min-h-[52px] max-h-32 flex-1 min-w-0 resize-none rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              title="Send message"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
