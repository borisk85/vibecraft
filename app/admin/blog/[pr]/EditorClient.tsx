"use client";

import { useEffect, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

type Props = {
  prNumber: number;
  initialMarkdown: string;
};

export default function EditorClient({ prNumber, initialMarkdown }: Props) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const editor = useCreateBlockNote();

  useEffect(() => {
    let cancelled = false;
    async function loadInitialMarkdown() {
      try {
        const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown);
        if (!cancelled) {
          editor.replaceBlocks(editor.document, blocks);
          setReady(true);
        }
      } catch (e) {
        console.error("Failed to parse markdown:", e);
        if (!cancelled) setReady(true);
      }
    }
    loadInitialMarkdown();
    return () => {
      cancelled = true;
    };
  }, [editor, initialMarkdown]);

  async function handleSave() {
    setSaving(true);
    setStatus("Сохраняю...");
    try {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      const res = await fetch(`/api/admin/blog/${prNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_markdown: markdown }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setStatus(
        data.unchanged
          ? "✅ Изменений нет — текст уже актуален, можно публиковать"
          : "✅ Сохранено! Превью обновится через 1-2 минуты",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
      setStatus(`❌ Ошибка: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="min-h-[600px] rounded-xl border border-white/10 bg-white p-2">
        {ready ? (
          <BlockNoteView editor={editor} theme="light" />
        ) : (
          <div className="p-8 text-center text-subtle">Загружаю текст...</div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving || !ready}
          className="rounded-xl bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Сохраняю..." : "Сохранить изменения"}
        </button>
        {status && <span className="text-sm text-muted">{status}</span>}
      </div>
    </div>
  );
}
