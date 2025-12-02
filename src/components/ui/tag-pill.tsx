// src/components/ui/tag-pill.tsx
import React from "react";

interface TagPillProps {
  tag: string;
  className?: string;
  onClick?: (tag: string) => void;
}

export const TagPill: React.FC<TagPillProps> = ({ tag, className = "", onClick }) => {
  return (
    <button
      onClick={() => onClick?.(tag)}
      className={`inline-flex items-center gap-2 px-2 py-0.5 text-xs font-medium rounded-full border border-transparent bg-blue-50 text-blue-700 hover:bg-blue-100 ${className}`}
      aria-label={`Tag ${tag}`}
      title={tag}
      type="button"
    >
      {tag}
    </button>
  );
};
