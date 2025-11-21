import { motion } from "framer-motion";
import { useRef } from "react";
import { ProjectCard } from "@/components/ui/project-card";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Sparkles, 
  Github, 
  Twitter, 
  ArrowDown, 
  Zap 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const projectsData = [
  {
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    title: "Modern Dashboard",
    author: "John Doe",
    techStack: "React + Tailwind",
    description: "A beautiful dashboard built with modern technologies."
  },
  {
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    title: "E-Commerce Platform",
    author: "Jane Smith",
    techStack: "Next.js + Stripe",
    description: "A full-featured online store with Stripe integration."
  },
];

const blogsData = [
  {
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800",
    title: "Getting Started with React",
    author: "Alex Johnson",
    techStack: "React Tutorial",
    description: "Learn the fundamentals of React."
  },
  {
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800",
    title: "Advanced TypeScript",
    author: "Maria Garcia",
    techStack: "TypeScript Guide",
    description: "Deep dive into TypeScript advanced types."
  },
];

const Index = () => {
  const projectsRef = useRef<HTMLDivElement>(null);
  const blogsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* HERO SECTION */}
      <AuroraBackground>
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative flex flex-col gap-4 items-center justify-center px-4"
        >
          <div className="text-3xl md:text-7xl font-bold text-white text-center">
            Showcase Your <span className="text-primary">Work</span>
          </div>
          <div className="text-white/70 max-w-2xl text-center">
            Discover developer projects and blogs.
          </div>

          <div className="flex gap-4 mt-4">
            <Button size="lg" onClick={() => navigate("/post")}>
              <Sparkles className="w-4 h-4" />
              Post something
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 text-white border-white/20"
              onClick={() => projectsRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore projects
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </AuroraBackground>

      {/* PROJECTS */}
      <section ref={projectsRef} className="min-h-screen px-4 py-20 flex justify-center">
        <div className="max-w-7xl w-full">
          <h2 className="text-5xl font-bold mb-12 text-center">Top Projects</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projectsData.slice(0, 8).map((p, i) => (
              <ProjectCard key={i} {...p} />
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <Button onClick={() => navigate("/projects")} className="px-8 py-6 text-lg">
              See more projects
            </Button>
          </div>
        </div>
      </section>

      {/* BLOGS */}
      <section ref={blogsRef} className="min-h-screen px-4 py-20 flex justify-center">
        <div className="max-w-7xl w-full">
          <h2 className="text-5xl font-bold mb-12 text-center">Developer Blogs</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {blogsData.slice(0, 8).map((b, i) => (
              <ProjectCard key={i} {...b} />
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <Button onClick={() => navigate("/blogs")} className="px-8 py-6 text-lg">
              See more blogs
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
