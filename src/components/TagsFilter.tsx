import React, { useState, useEffect, useRef } from "react";
import { Search, Tag } from "lucide-react";
import { fetchAllTags } from "@/lib/posts";

type TagsFilterProps = {
  selected: string[];
  onChange: (next: string[]) => void;
  type?: "project" | "blog" | null;
};

export function TagsFilter({ selected, onChange, type = null }: TagsFilterProps) {
  const [open, setOpen] = useState(false);
  const [allTags, setAllTags] = useState<{ tag: string; tag_count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Load tags
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchAllTags();
        if (mounted) setAllTags(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [type]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = allTags.filter((t) =>
    query ? t.tag.toLowerCase().includes(query.toLowerCase()) : true
  );

  function toggle(t: string) {
    if (selected.includes(t)) onChange(selected.filter((s) => s !== t));
    else onChange([...selected, t]);
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white shadow-sm hover:bg-gray-50"
      >
        <Tag className="w-4 h-4" />
        <span>Tags</span>
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute mt-2 w-72 bg-white border rounded-xl shadow-lg p-4 z-50">
          {/* Search Bar */}
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 mb-3 bg-gray-50">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              placeholder="Search tags..."
              className="w-full bg-transparent focus:outline-none text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Tags Area */}
          <div className="max-h-64 overflow-y-auto pr-1">
            {loading ? (
              <div className="text-sm text-gray-500">Loading tags...</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-gray-400">No tags found.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filtered.map((t) => {
                  const active = selected.includes(t.tag);
                  return (
                    <button
                      key={t.tag}
                      onClick={() => toggle(t.tag)}
                      className={`px-3 py-1 rounded-full border text-sm transition ${
                        active
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-gray-50 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {t.tag}{" "}
                      <span className="text-xs opacity-70">({t.tag_count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show selected chips */}
      <div className="mt-3 flex gap-2 flex-wrap">
        {selected.map((t) => (
          <span
            key={t}
            className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 border border-blue-300 cursor-pointer"
            onClick={() => toggle(t)}
          >
            {t} ✕
          </span>
        ))}
      </div>
    </div>
  );
}
