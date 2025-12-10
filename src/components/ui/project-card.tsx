// src/components/ui/project-card.tsx
import { FC } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface ProjectCardProps {
  image: string;
  title: string;
  author: string;
  techStack: string;
  description: string;
  onClick: () => void;
  likes_count?: number;
  onUpvote?: () => void;

  // ⭐ NEW
  isStarred?: boolean;
  onToggleStar?: () => void;
}

export const ProjectCard: FC<ProjectCardProps> = ({
  image,
  title,
  author,
  techStack,
  description,
  onClick,
  likes_count,
  onUpvote,
  isStarred = false,
  onToggleStar,
}) => {
  const { session } = (useAuth() as any) || {};

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // don't trigger card click
    if (!session) return; // optionally you can redirect to login here
    if (onToggleStar) onToggleStar();
  };

  const handleUpvoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpvote) onUpvote();
  };

  return (
    <div
      className="relative bg-white rounded-xl shadow-md overflow-hidden border hover:shadow-lg transition cursor-pointer"
      onClick={onClick}
    >
      {/* Cover image */}
      {image && (
        <div className="h-40 w-full overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ⭐ Star icon in top-right */}
      <button
        type="button"
        onClick={handleStarClick}
        disabled={!session}
        className={`absolute top-3 right-3 text-2xl ${
          isStarred ? "text-yellow-400" : "text-gray-300"
        } hover:scale-110 transition-transform disabled:opacity-50`}
        aria-label={isStarred ? "Unstar post" : "Star post"}
      >
        {isStarred ? "★" : "☆"}
      </button>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold mb-1 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-1">By {author}</p>
          {techStack && (
            <p className="text-xs text-gray-400 mb-2 line-clamp-1">
              {techStack}
            </p>
          )}
          <p className="text-sm text-gray-700 line-clamp-3">{description}</p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleUpvoteClick}
              disabled={!session}
            >
              ⬆ {likes_count ?? 0}
            </Button>
          </div>

          <Button size="sm" variant="default" onClick={onClick}>
            View
          </Button>
        </div>
      </div>
    </div>
  );
};
