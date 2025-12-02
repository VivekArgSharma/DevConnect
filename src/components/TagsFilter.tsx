// src/components/TagsFilter.tsx
import React, { useEffect, useState } from "react";
import { fetchAllTags } from "@/lib/posts";

type TagsFilterProps = {
  selected: string[];
  onChange: (next: string[]) => void;
  type?: "project" | "blog" | null;
};

export function TagsFilter({ selected, onChange, type = null }: TagsFilterProps) {
  const [allTags, setAllTags] = useState<{ tag: string; tag_count: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const data: any = await fetchAllTags();
        if (!mounted) return;
        setAllTags(data || []);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [type]);

  function toggle(t: string) {
    if (selected.includes(t)) onChange(selected.filter((s) => s !== t));
    else onChange([...selected, t]);
  }

  return (
    <div>
      <div className="flex gap-2 flex-wrap items-center">
        {loading && <div className="text-sm">Loading tags…</div>}
        {!loading && allTags.map((a) => {
          const active = selected.includes(a.tag);
          return (
            <button
              key={a.tag}
              type="button"
              onClick={() => toggle(a.tag)}
              className={`px-3 py-1 rounded-full text-sm border ${active ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <span className="mr-2">{a.tag}</span>
              <span className="text-xs text-muted-foreground">({a.tag_count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
