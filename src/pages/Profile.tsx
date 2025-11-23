// src/pages/Profile.tsx
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ui/project-card";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL as string;

interface PostAuthor {
  full_name: string | null;
  avatar_url: string | null;
}

interface Post {
  id: string;
  type: "project" | "blog";
  title: string;
  short_description: string | null;
  content: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  project_link: string | null;
  github_link: string | null;
  images: string[] | null;
  profiles?: PostAuthor;
}

const Profile = () => {
  const { loading, profile, session, signInWithGoogle, signOut, accessToken } = useAuth();
  const navigate = useNavigate();

  // ---- Fetch my projects ----
  const {
    data: myProjects = [],
    isLoading: loadingProjects,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery<Post[]>({
    queryKey: ["my-posts", "projects"],
    queryFn: async () => {
      if (!accessToken) return [];
      const res = await fetch(`${API_URL}/api/posts/mine?type=project`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to load your projects");
      }
      return res.json();
    },
    enabled: !!accessToken,
  });

  // ---- Fetch my blogs ----
  const {
    data: myBlogs = [],
    isLoading: loadingBlogs,
    error: blogsError,
    refetch: refetchBlogs,
  } = useQuery<Post[]>({
    queryKey: ["my-posts", "blogs"],
    queryFn: async () => {
      if (!accessToken) return [];
      const res = await fetch(`${API_URL}/api/posts/mine?type=blog`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to load your blogs");
      }
      return res.json();
    },
    enabled: !!accessToken,
  });

  // ---- Delete handler ----
  const handleDelete = async (id: string) => {
    if (!accessToken) {
      alert("You must be logged in to delete posts.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This cannot be undone."
    );
    if (!confirmed) return;

    const res = await fetch(`${API_URL}/api/posts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete post");
      return;
    }

    // Refresh both lists
    await Promise.all([refetchProjects(), refetchBlogs()]);
  };

  // ---- Auth loading ----
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-lg text-gray-600">Loading profile...</p>
      </div>
    );
  }

  // ---- Not logged in ----
  if (!session || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-lg w-full text-center border border-gray-200">
          <h1 className="text-2xl font-bold mb-4">Welcome to DevConnect</h1>
          <p className="text-gray-600 mb-6">
            Sign in with Google to create your profile, post projects and blogs,
            and manage them from here.
          </p>
          <Button onClick={signInWithGoogle}>Sign in with Google</Button>
        </div>
      </div>
    );
  }

  const displayName = profile.full_name || session.user?.email || "Developer";

  return (
    <div className="min-h-screen flex justify-center items-start px-4 py-20 bg-background">
      <div className="max-w-5xl w-full space-y-10">
        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 flex flex-col md:flex-row items-center md:items-start gap-6">
          <img
            src={
              profile.avatar_url ||
              "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(displayName) +
                "&background=0D8ABC&color=fff&size=256"
            }
            alt={displayName}
            className="w-28 h-28 rounded-full object-cover border-2 border-primary shadow-md"
          />
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="text-gray-600 text-sm">{session.user?.email}</p>
            <p className="text-gray-700 text-sm mt-2">
              This is your DevConnect profile. All projects and blogs you
              publish will appear here so you can manage them.
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>

        {/* Error messages */}
        {(projectsError || blogsError) && (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">
            {(projectsError as Error)?.message ||
              (blogsError as Error)?.message ||
              "Failed to load your posts."}
          </div>
        )}

        {/* Your projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your projects</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/post")}>
              + New project
            </Button>
          </div>

          {loadingProjects && (
            <p className="text-sm text-gray-500">Loading your projects...</p>
          )}

          {!loadingProjects && myProjects.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t posted any projects yet.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {myProjects.map((post) => (
              <div key={post.id} className="relative">
                <ProjectCard
                  image={
                    post.cover_image_url ||
                    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"
                  }
                  title={post.title}
                  author={post.profiles?.full_name || displayName}
                  techStack={
                    post.tags && post.tags.length > 0
                      ? post.tags.join(", ")
                      : "Project"
                  }
                  description={
                    post.short_description ||
                    (post.content ? post.content.slice(0, 160) + "..." : "")
                  }
                  onClick={() => navigate(`/projects/${post.id}`)}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-3 right-3"
                  onClick={() => handleDelete(post.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Your blogs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your blogs</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/post")}>
              + New blog
            </Button>
          </div>

          {loadingBlogs && (
            <p className="text-sm text-gray-500">Loading your blogs...</p>
          )}

          {!loadingBlogs && myBlogs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t posted any blogs yet.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {myBlogs.map((post) => (
              <div key={post.id} className="relative">
                <ProjectCard
                  image={
                    post.cover_image_url ||
                    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800"
                  }
                  title={post.title}
                  author={post.profiles?.full_name || displayName}
                  techStack={
                    post.tags && post.tags.length > 0
                      ? post.tags.join(", ")
                      : "Blog"
                  }
                  description={
                    post.short_description ||
                    (post.content ? post.content.slice(0, 160) + "..." : "")
                  }
                  onClick={() => navigate(`/blogs/${post.id}`)}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-3 right-3"
                  onClick={() => handleDelete(post.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
