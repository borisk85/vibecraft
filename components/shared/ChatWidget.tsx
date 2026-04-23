"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { siteConfig } from "@/lib/metadata";

interface Message {
  role: "user" | "assistant";
  content: string;
  isFeedback?: boolean;
}

const STORAGE_KEY = "vibecraft_chat";
const PROACTIVE_KEY = "vibecraft_chat_proactive_shown";
const GREETING =
  "Здравствуйте! Я AI-консультант Vibecraft. Помогу разобраться с услугами, ценами, сроками — что вас интересует?";
const PROACTIVE_TEXT =
  "Здравствуйте 👋 Если появятся вопросы по услугам или ценам — напишите мне.";
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000;

const EMOJIS = [
  "😀", "😊", "😍", "😎", "🤔", "👍", "👎", "👌", "👋", "🙏",
  "💡", "🚀", "🔥", "✨", "✅", "❌", "❓", "❗", "💬", "📝", "💰",
];

interface StoredHistory {
  messages: Message[];
  lastActivity: number;
}

const FEEDBACK_KEY = "vibecraft_chat_feedback";

interface StoredFeedback {
  dislikes: number;
  ratedIdx: number[];
  lastActivity: number;
}

function loadFeedback(): { dislikes: number; ratedIdx: number[] } {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredFeedback;
      if (
        parsed &&
        typeof parsed.dislikes === "number" &&
        Array.isArray(parsed.ratedIdx) &&
        typeof parsed.lastActivity === "number" &&
        Date.now() - parsed.lastActivity <= HISTORY_TTL_MS
      ) {
        return { dislikes: parsed.dislikes, ratedIdx: parsed.ratedIdx };
      }
      localStorage.removeItem(FEEDBACK_KEY);
    }
  } catch {}
  return { dislikes: 0, ratedIdx: [] };
}

function saveFeedback(dislikes: number, ratedIdx: number[]) {
  try {
    const stored: StoredFeedback = {
      dislikes,
      ratedIdx,
      lastActivity: Date.now(),
    };
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(stored));
  } catch {}
}

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray(parsed.messages) &&
        typeof parsed.lastActivity === "number"
      ) {
        const isExpired = Date.now() - parsed.lastActivity > HISTORY_TTL_MS;
        if (!isExpired && parsed.messages.length > 0) {
          return parsed.messages;
        }
        localStorage.removeItem(STORAGE_KEY);
      } else if (Array.isArray(parsed)) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch {}
  return [{ role: "assistant", content: GREETING }];
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [proactive, setProactive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [ratings, setRatings] = useState<Record<number, "up" | "down">>({});
  const [sessionDislikes, setSessionDislikes] = useState(0);
  const MAX_SESSION_DISLIKES = 3;
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);
  const proactiveShown = useRef(false);
  const ratedIdxRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setMessages(loadHistory());
      const { dislikes, ratedIdx } = loadFeedback();
      setSessionDislikes(dislikes);
      ratedIdxRef.current = new Set(ratedIdx);
    }
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(PROACTIVE_KEY)) return;
    } catch {}

    function showProactive() {
      if (proactiveShown.current || open) return;
      proactiveShown.current = true;
      try {
        sessionStorage.setItem(PROACTIVE_KEY, "1");
      } catch {}
      setProactive(true);
    }

    const timer = setTimeout(showProactive, 25000);

    function onExitIntent(e: MouseEvent) {
      if (e.clientY <= 0) showProactive();
    }
    document.addEventListener("mouseleave", onExitIntent);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", onExitIntent);
    };
  }, [open]);

  useEffect(() => {
    if (initialized.current) {
      try {
        const stored: StoredHistory = {
          messages,
          lastActivity: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      } catch {}
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
      inputRef.current?.focus();
    }
  }, [open, messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(1);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.reply ??
            data.error ??
            "Что-то пошло не так. Напишите Борису в Telegram @borisk85.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Не удалось отправить запрос. Попробуйте позже или напишите в Telegram @borisk85.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function rate(idx: number, val: "up" | "down") {
    setRatings((prev) => {
      const copy = { ...prev };
      if (copy[idx] === val) delete copy[idx];
      else copy[idx] = val;
      return copy;
    });

    if (ratedIdxRef.current.has(idx)) return;

    const message = messages[idx];
    if (!message || message.role !== "assistant") return;

    if (val === "down" && sessionDislikes >= MAX_SESSION_DISLIKES) return;

    ratedIdxRef.current.add(idx);

    if (val === "up") {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Спасибо за оценку!",
          isFeedback: true,
        },
      ]);
      saveFeedback(sessionDislikes, Array.from(ratedIdxRef.current));
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Спасибо за обратную связь — передам это автору.",
        isFeedback: true,
      },
    ]);

    const newDislikes = sessionDislikes + 1;
    setSessionDislikes(newDislikes);
    saveFeedback(newDislikes, Array.from(ratedIdxRef.current));

    const userQuestion = idx > 0 ? messages[idx - 1] : null;

    fetch("/api/chat/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rating: val,
        assistantReply: message.content,
        userQuestion: userQuestion?.content ?? null,
      }),
    }).catch(() => {});
  }

  function insertEmoji(emoji: string) {
    setInput((v) => v + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/60 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                AI-консультант
              </p>
              <p className="text-xs text-success">Онлайн</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Закрыть чат"
              className="p-1 text-muted transition-colors hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 py-4 min-h-[260px] max-h-[340px] sm:min-h-[340px] sm:max-h-[440px]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex min-w-0 flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`flex w-full min-w-0 gap-3 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-accent-text">
                      V
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] min-w-0 whitespace-pre-line break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-gradient-accent text-white"
                        : "rounded-bl-sm bg-surface text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
                {m.role === "assistant" && i > 0 && !m.isFeedback && (
                  <div className="ml-10 mt-1 flex gap-0.5">
                    <button
                      onClick={() => rate(i, "up")}
                      className={`rounded-md p-1.5 transition-colors ${
                        ratings[i] === "up"
                          ? "text-success"
                          : "text-subtle hover:text-muted"
                      }`}
                      title="Полезно"
                      aria-label="Полезно"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => rate(i, "down")}
                      disabled={
                        !ratings[i] &&
                        sessionDislikes >= MAX_SESSION_DISLIKES
                      }
                      className={`rounded-md p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                        ratings[i] === "down"
                          ? "text-error"
                          : "text-subtle hover:text-muted"
                      }`}
                      title="Не полезно"
                      aria-label="Не полезно"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-accent-text">
                  V
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-surface px-4 py-3">
                  <svg
                    className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-muted"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <span className="text-sm text-muted">Думаю...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border bg-background px-4 py-3">
            <div className="relative">
              {showEmoji && (
                <div className="absolute bottom-full right-0 z-10 mb-2 grid grid-cols-7 gap-1 rounded-xl border border-border bg-card p-2 shadow-xl">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => insertEmoji(e)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-surface"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2 rounded-xl bg-surface px-4 py-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "24px";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 80) + "px";
                  }}
                  onKeyDown={onKey}
                  placeholder="Задайте вопрос..."
                  maxLength={500}
                  rows={1}
                  className="flex-1 resize-none bg-transparent leading-relaxed text-foreground placeholder:text-subtle outline-none"
                  style={{
                    height: "24px",
                    maxHeight: "80px",
                    fontSize: "16px",
                    lineHeight: "24px",
                  }}
                />
                <button
                  onClick={() => setShowEmoji((v) => !v)}
                  className="mb-0.5 flex-shrink-0 text-muted transition-colors hover:text-foreground"
                  title="Эмодзи"
                  aria-label="Эмодзи"
                >
                  <span className="text-lg leading-none">😊</span>
                </button>
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  aria-label="Отправить сообщение"
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent transition-all hover:opacity-90 disabled:opacity-30"
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] leading-snug text-subtle">
              AI-консультант может ошибаться — важные моменты уточняйте лично
              у Бориса в{" "}
              <a
                href={siteConfig.contacts.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-text hover:underline"
              >
                Telegram →
              </a>
            </p>
          </div>
        </div>
      )}

      {proactive && !open && (
        <div className="relative max-w-[260px] rounded-2xl rounded-br-sm border border-border bg-card px-4 py-3 shadow-xl shadow-black/40">
          <button
            onClick={() => setProactive(false)}
            className="absolute right-2 top-2 text-subtle transition-colors hover:text-muted"
            aria-label="Закрыть"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p
            className="cursor-pointer pr-4 text-sm leading-relaxed text-foreground"
            onClick={() => {
              setProactive(false);
              setOpen(true);
            }}
          >
            {PROACTIVE_TEXT}
          </p>
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => {
            setOpen((v) => !v);
            setProactive(false);
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-accent shadow-[0_0_30px_-10px_rgb(139_92_246/0.6)] transition-all hover:scale-105 hover:shadow-[0_0_40px_-8px_rgb(139_92_246/0.75)] active:scale-95"
          aria-label="Открыть чат"
        >
          {open ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <MessageCircle className="h-6 w-6 text-white" />
          )}
        </button>
        {!open && (
          <span className="absolute right-0.5 top-0.5">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-background bg-success" />
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
