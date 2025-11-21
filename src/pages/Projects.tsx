import { ProjectCard } from "@/components/ui/project-card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const projectsData = [
  {
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    title: "Modern Dashboard",
    author: "John Doe",
    techStack: "React + Tailwind",
    description: "A modern dashboard interface."
  },
];

const Projects = () => {
  const [visible, setVisible] = useState(12);

  return (
    <div className="min-h-screen px-4 py-20 flex justify-center">
      <div className="max-w-7xl w-full">
        <h1 className="text-5xl font-bold text-center mb-12">All Projects</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projectsData.slice(0, visible).map((item, i) => (
            <ProjectCard key={i} {...item} />
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Button onClick={() => setVisible(visible + 12)} className="px-8 py-6 text-lg">
            See more
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Projects;
