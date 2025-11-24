import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { upvotePost } from "@/lib/upvote";

const API_URL = import.meta.env.VITE_API_URL;

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();

  const {
    data: post,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/posts/${id}`);
      if (!res.ok) throw new Error("Post not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-600">Loading project...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-red-600">Project not found.</p>
      </div>
    );
  }

  const isOwner = user?.id === post.user_id;

  const handleDelete = async () => {
    if (!accessToken) return;

    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    const res = await fetch(`${API_URL}/api/posts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      alert("Failed to delete.");
      return;
    }

    navigate("/projects");
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <img
        src={post.cover_image_url}
        alt={post.title}
        className="w-full h-72 object-cover rounded-xl shadow"
      />

      <h1 className="text-3xl font-bold">{post.title}</h1>

      <div className="flex items-center gap-3 text-gray-600">
        <img
          src={post.profiles?.avatar_url}
          alt="author"
          className="w-10 h-10 rounded-full border"
        />
        <span>{post.profiles?.full_name}</span>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Button
          variant="outline"
          onClick={async () => {
            await upvotePost(post.id, accessToken, API_URL);
            refetch();
          }}
        >
          ⬆ Upvote ({post.likes_count})
        </Button>

        {isOwner && (
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>

      <p className="text-gray-700 whitespace-pre-line">{post.content}</p>

      {post.project_link && (
        <a
          href={post.project_link}
          target="_blank"
          className="text-blue-600 underline block mt-4"
        >
          Project Link
        </a>
      )}

      {post.github_link && (
        <a
          href={post.github_link}
          target="_blank"
          className="text-blue-600 underline block"
        >
          GitHub Repository
        </a>
      )}
    </div>
  );
}
