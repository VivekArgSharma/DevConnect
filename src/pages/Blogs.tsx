import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ProjectCard } from "@/components/ui/project-card";
import { upvotePost } from "@/lib/upvote";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function Blogs() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const { data: posts = [], refetch } = useQuery({
    queryKey: ["blogs"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/posts?type=blog`);
      return res.json();
    },
  });

  return (
    <div className="max-w-6xl mx-auto py-10 space-y-8 px-4">
      <h1 className="text-3xl font-bold">All Blogs</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <ProjectCard
            key={post.id}
            image={post.cover_image_url}
            title={post.title}
            author={post.profiles?.full_name || "Unknown"}
            techStack={post.tags?.join(", ") || "Blog"}
            description={post.short_description || ""}
            likes_count={post.likes_count}
            onClick={() => navigate(`/blogs/${post.id}`)}
            onUpvote={async () => {
              await upvotePost(post.id, accessToken, API_URL);
              refetch();
            }}
          />
        ))}
      </div>
    </div>
  );
}
