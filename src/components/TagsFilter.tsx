// src/components/TagsFilter.tsx
import React, { useState, useEffect, useRef } from "react";
import { Search, Tag } from "lucide-react";
import { fetchAllTags } from "@/lib/posts";

type Props = {
  selected: string[];
  onChange: (next: string[]) => void;
  type: "project" | "blog";
};

export function TagsFilter({ selected, onChange, type }: Props) {
  const [open, setOpen] = useState(false);
  const [allTags, setAllTags] = useState<{ tag: string; tag_count: number }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load correct tags based on type
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchAllTags(type);
        if (mounted) setAllTags(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [type]);

  // Close when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = allTags.filter((t) =>
    t.tag.toLowerCase().includes(query.toLowerCase())
  );

  function toggle(t: string) {
    if (selected.includes(t)) {
      onChange(selected.filter((s) => s !== t));
    } else {
      onChange([...selected, t]);
    }
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card text-foreground shadow-sm hover:bg-secondary transition-colors"
      >
        <Tag className="w-4 h-4" />
        <span>Filter Tags</span>
      </button>

      {open && (
        <div className="absolute mt-2 w-72 bg-card border border-border rounded-xl shadow-lg p-4 z-50">
          {/* Search bar */}
          <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 mb-3 bg-secondary">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search tags..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Tag list */}
          <div className="max-h-64 overflow-y-auto pr-1 flex flex-wrap gap-2">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading tags…</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground">No tags found.</div>
            ) : (
              filtered.map((t) => {
                const active = selected.includes(t.tag);
                return (
                  <button
                    key={t.tag}
                    onClick={() => toggle(t.tag)}
                    className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-foreground hover:bg-secondary/80 border-border"
                    }`}
                  >
                    {t.tag}
                    <span className="text-xs opacity-60 ml-1">
                      ({t.tag_count})
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Selected Chips */}
      <div className="mt-3 flex gap-2 flex-wrap">
        {selected.map((t) => (
          <span
            key={t}
            className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm cursor-pointer hover:bg-primary/30 transition-colors"
            onClick={() => toggle(t)}
          >
            {t} ✕
          </span>
        ))}
      </div>
    </div>
  );
}
