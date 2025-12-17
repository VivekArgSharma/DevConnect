import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL as string;

interface Post {
  id: string;
  title: string;
  type: "blog" | "project";
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles?: {
    full_name?: string;
  };
}

export default function AdminDashboard() {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* -----------------------------------------------------
     LOAD PENDING POSTS (BACKEND ENFORCES ADMIN)
  ----------------------------------------------------- */
  useEffect(() => {
    async function loadPending() {
      if (!accessToken) return;

      try {
        setLoading(true);

        const res = await axios.get(
          `${API_URL}/admin/posts?status=pending`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        setPosts(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        console.error("Admin fetch failed:", err);
        if (err.response?.status === 403) {
          setError("Unauthorized: Admin access only");
        } else {
          setError("Failed to load pending posts");
        }
      } finally {
        setLoading(false);
      }
    }

    loadPending();
  }, [accessToken]);

  /* -----------------------------------------------------
     UPDATE STATUS
  ----------------------------------------------------- */
  async function updateStatus(
    postId: string,
    status: "approved" | "rejected"
  ) {
    if (!accessToken) return;

    try {
      await axios.patch(
        `${API_URL}/admin/posts/${postId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Failed to update post status");
    }
  }

  /* -----------------------------------------------------
     RENDER
  ----------------------------------------------------- */
  if (!user) {
    return <div className="p-6">You must be logged in.</div>;
  }

  if (loading) {
    return <div className="p-6">Loading pending posts…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {posts.length === 0 ? (
        <p className="text-gray-500">No pending posts 🎉</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <h2 className="text-lg font-semibold">{post.title}</h2>
                <p className="text-sm text-gray-500">
                  {post.type.toUpperCase()} • by{" "}
                  {post.profiles?.full_name ?? "Unknown"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/admin/posts/${post.id}`)}
                >
                  View
                </Button>

                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => updateStatus(post.id, "approved")}
                >
                  Accept
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => updateStatus(post.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
