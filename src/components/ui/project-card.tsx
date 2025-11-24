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
}

export const ProjectCard: FC<ProjectCardProps> = ({
  image,
  title,
  author,
  techStack,
  description,
  onClick,
  likes_count = 0,
  onUpvote,
}) => {
  const { session } = useAuth();

  return (
    <div
      className="border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer bg-white"
    >
      <img
        src={image}
        alt={title}
        className="w-full h-48 object-cover"
        onClick={onClick}
      />

      <div className="p-4 space-y-2">
        <h3
          className="font-semibold text-lg"
          onClick={onClick}
        >
          {title}
        </h3>

        <p className="text-sm text-gray-500">{author}</p>

        <p className="text-xs text-gray-600">{techStack}</p>

        <p
          className="text-sm text-gray-700 line-clamp-3"
          onClick={onClick}
        >
          {description}
        </p>

        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onUpvote?.();
              }}
              disabled={!session}
            >
              ⬆ {likes_count}
            </Button>
          </div>

          <Button size="sm" onClick={onClick}>
            View
          </Button>
        </div>
      </div>
    </div>
  );
};
