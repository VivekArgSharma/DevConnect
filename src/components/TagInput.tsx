// src/components/TagInput.tsx
import React, { useEffect, useState } from "react";
import { fetchAllTags } from "@/lib/posts";

type TagInputProps = {
  value?: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestionLimit?: number;
};

export default function TagInput({
  value = [],
  onChange,
  placeholder = "Add tags (press Enter or comma)",
  suggestionLimit = 8,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [tags, setTags] = useState<string[]>(value || []);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => setTags(value || []), [value]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data: any = await fetchAllTags();
        if (!mounted || !data) return;
        setSuggestions(data.map((d: any) => d.tag));
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  function normalize(t: string) {
    return t.trim().toLowerCase();
  }

  function addTag(raw: string) {
    const t = normalize(raw);
    if (!t) return;
    if (tags.includes(t)) {
      setInput("");
      return;
    }
    const next = [...tags, t];
    setTags(next);
    onChange(next);
    setInput("");
  }

  function removeTag(i: number) {
    const next = tags.filter((_, idx) => idx !== i);
    setTags(next);
    onChange(next);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length) {
      removeTag(tags.length - 1);
    }
  }

  const filtered = suggestions
    .filter((s) => !tags.includes(s))
    .filter((s) => (input ? s.includes(input.toLowerCase()) : true))
    .slice(0, suggestionLimit);

  return (
    <div>
      <div className="flex gap-2 flex-wrap items-center">
        {tags.map((t, i) => (
          <div key={t} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm">
            <span>{t}</span>
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="text-xs px-1"
              aria-label={`Remove ${t}`}
            >
              ✕
            </button>
          </div>
        ))}

        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={onKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className="min-w-[160px] px-3 py-1 border rounded"
        />
      </div>

      {showSuggestions && filtered.length > 0 && (
        <div className="mt-2 border rounded bg-white p-2 shadow-sm max-w-md">
          <div className="text-xs text-muted-foreground mb-2">Suggestions</div>
          <div className="flex gap-2 flex-wrap">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={() => { addTag(s); }}
                className="px-3 py-1 rounded-full border text-sm"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
