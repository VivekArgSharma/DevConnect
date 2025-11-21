import { ProjectCard } from "@/components/ui/project-card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const blogsData = [
  {
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800",
    title: "Getting Started with React",
    author: "Alex Johnson",
    techStack: "React Tutorial",
    description: "Learn the fundamentals of React."
  },
];

const Blogs = () => {
  const [visible, setVisible] = useState(12);

  return (
    <div className="min-h-screen px-4 py-20 flex justify-center">
      <div className="max-w-7xl w-full">
        <h1 className="text-5xl font-bold text-center mb-12">Developer Blogs</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {blogsData.slice(0, visible).map((item, i) => (
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

export default Blogs;
