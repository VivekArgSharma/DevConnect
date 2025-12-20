// src/components/ui/project-card.tsx
import { FC } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowUp, Star, Eye } from "lucide-react";

interface ProjectCardProps {
  image: string;
  title: string;
  author: string;
  techStack: string;
  description: string;
  onClick: () => void;
  likes_count?: number;
  onUpvote?: () => void;
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
    e.stopPropagation();
    if (!session) return;
    if (onToggleStar) onToggleStar();
  };

  const handleUpvoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpvote) onUpvote();
  };

  return (
    <div
      className="group relative bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
      onClick={onClick}
    >
      {/* Cover image */}
      {image && (
        <div className="relative h-44 w-full overflow-hidden bg-secondary">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
        </div>
      )}

      {/* Star button */}
      {session && (
        <button
          type="button"
          onClick={handleStarClick}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
            isStarred 
              ? "bg-primary/20 text-primary" 
              : "bg-card/60 text-muted-foreground hover:text-primary hover:bg-card/80"
          }`}
          aria-label={isStarred ? "Unstar post" : "Star post"}
        >
          <Star className={`w-4 h-4 ${isStarred ? "fill-current" : ""}`} />
        </button>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col gap-3">
        {/* Title & Author */}
        <div>
          <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            by <span className="text-foreground/80">{author}</span>
          </p>
        </div>

        {/* Tech Stack Tags */}
        {techStack && (
          <div className="flex flex-wrap gap-1.5">
            {techStack.split(",").slice(0, 3).map((tech, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs font-medium rounded-md bg-secondary text-muted-foreground"
              >
                {tech.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-border/50">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUpvoteClick}
            disabled={!session}
            className="gap-1.5 text-muted-foreground hover:text-primary"
          >
            <ArrowUp className="w-4 h-4" />
            <span className="font-medium">{likes_count ?? 0}</span>
          </Button>

          <Button 
            size="sm" 
            variant="subtle"
            onClick={onClick}
            className="gap-1.5"
          >
            <Eye className="w-4 h-4" />
            View
          </Button>
        </div>
      </div>
    </div>
  );
};
