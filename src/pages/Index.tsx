// src/pages/index.tsx
import { motion } from "framer-motion";
import { useRef } from "react";
import { ProjectCard } from "@/components/ui/project-card";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { upvotePost } from "@/lib/upvote";

// Load env once to avoid re-reading
const API_URL = import.meta.env.VITE_API_URL;

const Index = () => {
  const projectsRef = useRef<HTMLDivElement>(null);
  const blogsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  /* ------------------------------------------------------
     FETCH TOP PROJECTS
  ------------------------------------------------------ */
  const { data: topProjects = [], refetch: refetchProjects } = useQuery({
    queryKey: ["top-projects"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/posts?type=project`);
      const data = await res.json();

      return data
        .sort((a, b) => b.likes_count - a.likes_count)
        .slice(0, 8);
    },
  });

  /* ------------------------------------------------------
     FETCH TOP BLOGS
  ------------------------------------------------------ */
  const { data: topBlogs = [], refetch: refetchBlogs } = useQuery({
    queryKey: ["top-blogs"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/posts?type=blog`);
      const data = await res.json();

      return data
        .sort((a, b) => b.likes_count - a.likes_count)
        .slice(0, 8);
    },
  });

  return (
    // ❗ FIX: Remove white background (bg-background is white)
    <div className="min-h-screen bg-transparent">
      {/* ====================== HERO ====================== */}
      <AuroraBackground>
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative flex flex-col gap-4 items-center justify-center px-4 pt-32 pb-24"
        >
          <div className="text-3xl md:text-7xl font-bold text-white text-center drop-shadow-xl">
            Showcase Your <span className="text-primary">Work</span>
          </div>

          <div className="text-white/70 max-w-2xl text-center text-lg md:text-xl">
            Discover developer projects and blogs.
          </div>

          <div className="flex gap-4 mt-6">
            {/* Post something */}
            <Button size="lg" onClick={() => navigate("/post")}>
              <Sparkles className="w-4 h-4" />
              Post something
              <ArrowRight className="w-4 h-4" />
            </Button>

            {/* Scroll to projects */}
            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() =>
                projectsRef.current?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore projects
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </AuroraBackground>

      {/* ====================== PROJECTS ====================== */}
      <section
        ref={projectsRef}
        className="min-h-screen px-4 py-20 flex justify-center"
      >
        <div className="max-w-7xl w-full">
          <h2 className="text-5xl font-bold mb-12 text-center">
            Top Projects
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {topProjects.length > 0 ? (
              topProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  image={p.cover_image_url}
                  title={p.title}
                  author={p.profiles?.full_name || "Unknown"}
                  techStack={p.tags?.join(", ") || "Project"}
                  description={p.short_description}
                  likes_count={p.likes_count}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  onUpvote={async () => {
                    await upvotePost(p.id, accessToken, API_URL);
                    refetchProjects();
                  }}
                />
              ))
            ) : (
              <p className="text-center w-full text-gray-500">
                No projects posted yet.
              </p>
            )}
          </div>

          <div className="flex justify-center mt-10">
            <Button
              onClick={() => navigate("/projects")}
              className="px-8 py-6 text-lg"
            >
              See more projects
            </Button>
          </div>
        </div>
      </section>

      {/* ====================== BLOGS ====================== */}
      <section
        ref={blogsRef}
        className="min-h-screen px-4 py-20 flex justify-center"
      >
        <div className="max-w-7xl w-full">
          <h2 className="text-5xl font-bold mb-12 text-center">
            Developer Blogs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {topBlogs.length > 0 ? (
              topBlogs.map((b) => (
                <ProjectCard
                  key={b.id}
                  image={b.cover_image_url}
                  title={b.title}
                  author={b.profiles?.full_name || "Unknown"}
                  techStack={b.tags?.join(", ") || "Blog"}
                  description={b.short_description}
                  likes_count={b.likes_count}
                  onClick={() => navigate(`/blogs/${b.id}`)}
                  onUpvote={async () => {
                    await upvotePost(b.id, accessToken, API_URL);
                    refetchBlogs();
                  }}
                />
              ))
            ) : (
              <p className="text-center w-full text-gray-500">
                No blogs posted yet.
              </p>
            )}
          </div>

          <div className="flex justify-center mt-10">
            <Button
              onClick={() => navigate("/blogs")}
              className="px-8 py-6 text-lg"
            >
              See more blogs
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
