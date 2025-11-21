import React from "react";

interface ProjectCardProps {
  image: string;
  title: string;
  author: string;
  techStack: string;
  description: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  image,
  title,
  author,
  techStack,
  description,
}) => {
  return (
    <div
      className="
        w-full 
        bg-white 
        rounded-xl 
        shadow-md 
        overflow-hidden 
        border 
        border-gray-200
        hover:shadow-lg
        transition-all 
        duration-200 
        flex 
        flex-col
        sm:flex-row
      "
      style={{ minHeight: "180px" }}
    >
      {/* IMAGE LEFT */}
      <div className="sm:w-2/5 w-full h-44 sm:h-auto overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* CONTENT RIGHT */}
      <div className="sm:w-3/5 w-full p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {title}
          </h3>

          <p className="text-sm text-gray-500 mb-3">
            {techStack}
          </p>

          <p className="text-gray-700 text-sm line-clamp-3">
            {description}
          </p>
        </div>

        <p className="text-sm text-gray-600 mt-3">
          <span className="font-semibold">By:</span> {author}
        </p>
      </div>
    </div>
  );
};
