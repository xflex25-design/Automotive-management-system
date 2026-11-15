import { useState, useEffect } from "react";
import { StickyNote, Plus, Trash2, Copy, Check, RotateCcw, Clock, Sparkles } from "./fa-icons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface ScratchNote {
  id: string;
  text: string;
  time: string;
}

export function EmployeeScratchpad({ department }: { department: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scratchpadText, setScratchpadText] = useState("");
  const [notes, setNotes] = useState<ScratchNote[]>([]);
  const [newNoteInput, setNewNoteInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load from sessionStorage on client mount
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined" || !window.sessionStorage) return;
    try {
      const savedText = sessionStorage.getItem("hi_rider_scratchpad_text");
      if (savedText) setScratchpadText(savedText);

      const savedNotes = sessionStorage.getItem("hi_rider_scratchpad_notes");
      if (savedNotes) setNotes(JSON.parse(savedNotes) as ScratchNote[]);
    } catch (err) {
      console.warn(err);
    }
  }, []);

  function handleSaveText(text: string) {
    setScratchpadText(text);
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        sessionStorage.setItem("hi_rider_scratchpad_text", text);
      } catch (err) {
        console.warn(err);
      }
    }
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteInput.trim()) return;

    const newNote: ScratchNote = {
      id: `note-${Date.now()}`,
      text: newNoteInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    setNewNoteInput("");

    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        sessionStorage.setItem("hi_rider_scratchpad_notes", JSON.stringify(updated));
      } catch (err) {
        console.warn(err);
      }
    }
    toast.success("Quick note added to scratchpad");
  }

  function handleDeleteNote(id: string) {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        sessionStorage.setItem("hi_rider_scratchpad_notes", JSON.stringify(updated));
      } catch (err) {
        console.warn(err);
      }
    }
    toast.info("Note removed");
  }

  function handleCopyNote(id: string, text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Copied to clipboard");
    }
  }

  function handleClearAll() {
    setScratchpadText("");
    setNotes([]);
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        sessionStorage.removeItem("hi_rider_scratchpad_text");
        sessionStorage.removeItem("hi_rider_scratchpad_notes");
      } catch (err) {
        console.warn(err);
      }
    }
    toast.success("Scratchpad cleared");
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="gap-2 h-9">
        <StickyNote size={14} className="text-amber-500" />
        <span>Scratchpad</span>
      </Button>
    );
  }

  const totalCount = notes.length + (scratchpadText.trim() ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9 relative">
          <StickyNote size={14} className="text-amber-500" />
          <span>Scratchpad</span>
          {totalCount > 0 && (
            <span className="w-4 h-4 text-xs font-medium tabular-nums bg-amber-500 text-white rounded-full flex items-center justify-center">
              {totalCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-6 overflow-y-auto bg-background border-l border-border"
      >
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <StickyNote size={18} />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold text-foreground">
                {department} Floor Scratchpad
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Session-only notes. Kept during your shift without touching the database.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 py-4 space-y-6">
          {/* Quick Add Form */}
          <form onSubmit={handleAddNote} className="space-y-2">
            <label htmlFor="scratchpad-note-input" className="registration-label block">
              Add Quick Floor Reminder
            </label>
            <div className="flex gap-2">
              <input
                id="scratchpad-note-input"
                type="text"
                placeholder="e.g. Bay 2 torque wrench recalibration, test drive note..."
                value={newNoteInput}
                onChange={(e) => setNewNoteInput(e.target.value)}
                className="registration-input flex-1"
              />
              <Button type="submit" size="sm" className="registration-submit-btn gap-1.5">
                <Plus size={13} /> Add
              </Button>
            </div>
          </form>

          {/* Quick Note Cards */}
          {notes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Active Shift Notes ({notes.length})</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-muted/60 border border-border rounded-lg flex items-start justify-between gap-3 group transition-colors hover:bg-muted"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-normal text-foreground break-words">{note.text}</p>
                      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground tabular-nums">
                        <Clock size={10} />
                        <span>{note.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleCopyNote(note.id, note.text)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                        title="Copy note"
                        aria-label="Copy note"
                      >
                        {copiedId === note.id ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-background transition-colors"
                        title="Delete note"
                        aria-label="Delete note"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Freeform Scratchpad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-label block">
                Freeform Scratchpad
              </label>
              <span className="text-xs font-medium text-muted-foreground">
                Auto-saved to session
              </span>
            </div>
            <textarea
              rows={8}
              value={scratchpadText}
              onChange={(e) => handleSaveText(e.target.value)}
              placeholder="Paste part numbers, measurements, diagnostic readings, or notes here. This workspace is ephemeral and auto-saved for your current browser session..."
              className="w-full p-3 bg-background border border-border rounded-xl text-sm font-normal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Footer info & Clear button */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles size={12} className="text-amber-500" />
            <span>Session storage only · No DB writes</span>
          </div>
          {(notes.length > 0 || scratchpadText.trim()) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
            >
              <RotateCcw size={12} /> Clear Scratchpad
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
