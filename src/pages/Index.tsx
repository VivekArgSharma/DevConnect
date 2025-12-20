// src/pages/index.tsx
import { motion } from "framer-motion";
import { useRef } from "react";
import { ProjectCard } from "@/components/ui/project-card";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ArrowDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { upvotePost } from "@/lib/upvote";
import Squares from "@/components/ui/Squares";
import FeatureCarousel from "@/components/ui/feature-carousel";

const API_URL = import.meta.env.VITE_API_URL;
const LIMIT = 8;

const Index = () => {
  const projectsRef = useRef<HTMLDivElement>(null);
  const blogsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const {
    data: topProjects = [],
    refetch: refetchProjects,
    isLoading: loadingProjects,
  } = useQuery({
    queryKey: ["top-projects"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/posts/top/projects?limit=${LIMIT}`);
      return res.json();
    },
    staleTime: 120_000,
  });

  const {
    data: topBlogs = [],
    refetch: refetchBlogs,
    isLoading: loadingBlogs,
  } = useQuery({
    queryKey: ["top-blogs"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/posts/top/blogs?limit=${LIMIT}`);
      return res.json();
    },
    staleTime: 120_000,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <AuroraBackground>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative flex flex-col gap-6 items-center justify-center px-4 pt-32 pb-28"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground text-center tracking-tight">
            Showcase Your <span className="text-primary">Work</span>
          </h1>

          <p className="text-muted-foreground max-w-2xl text-center text-lg md:text-xl">
            Discover developer projects and blogs from the community.
          </p>

          <div className="flex gap-4 mt-4">
            <Button size="lg" onClick={() => navigate("/post")} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Post something
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => projectsRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="gap-2"
            >
              Explore
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </AuroraBackground>

      {/* CONTENT WITH SQUARES BACKGROUND */}
      <div className="relative">
        {/* Squares Background */}
        <div className="absolute inset-0 -z-10">
          <Squares
            direction="diagonal"
            speed={0.3}
            borderColor="hsl(var(--border) / 0.3)"
            squareSize={50}
            hoverFillColor="hsl(var(--primary) / 0.1)"
          />
        </div>

        {/* FEATURE CAROUSEL */}
        <section className="px-4 py-16 md:py-20 relative">
          <div className="flex justify-center">
            <FeatureCarousel
              baseWidth={340}
              autoplay={true}
              autoplayDelay={3500}
              pauseOnHover={true}
              loop={true}
              round={false}
            />
          </div>
        </section>

        {/* PROJECTS */}
        <section ref={projectsRef} className="px-4 py-20 md:py-28 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Top Projects</h2>
              <p className="text-muted-foreground mt-2">Featured work from the community</p>
            </div>

            {loadingProjects ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : topProjects.length === 0 ? (
              <div className="text-center py-12 bg-card/80 backdrop-blur-sm border border-border rounded-xl">
                <p className="text-muted-foreground">No projects posted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {topProjects.map((p: any) => (
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
                ))}
              </div>
            )}

            <div className="flex justify-center mt-12">
              <Button onClick={() => navigate("/projects")} size="lg" variant="secondary" className="bg-card/80 backdrop-blur-sm border-border">
                See all projects
              </Button>
            </div>
          </div>
        </section>

        {/* BLOGS */}
        <section ref={blogsRef} className="px-4 py-20 md:py-28 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Developer Blogs</h2>
              <p className="text-muted-foreground mt-2">Insights and tutorials from developers</p>
            </div>

            {loadingBlogs ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : topBlogs.length === 0 ? (
              <div className="text-center py-12 bg-card/80 backdrop-blur-sm border border-border rounded-xl">
                <p className="text-muted-foreground">No blogs posted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {topBlogs.map((b: any) => (
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
                ))}
              </div>
            )}

            <div className="flex justify-center mt-12">
              <Button onClick={() => navigate("/blogs")} size="lg" variant="secondary" className="bg-card/80 backdrop-blur-sm border-border">
                See all blogs
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
