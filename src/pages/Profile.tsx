import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ui/project-card";
import { upvotePost } from "@/lib/upvote";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function Profile() {
  const { user, accessToken, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();

  // If user is NOT logged in → show login page
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-3xl font-bold mb-4">You are not signed in</h1>
        <p className="text-gray-600 mb-6">
          Please sign in to view your profile and your posts.
        </p>

        <Button size="lg" onClick={signInWithGoogle}>
          Sign in with Google
        </Button>
      </div>
    );
  }

  // Fetch posts only IF user is logged in
  const {
    data: myPosts = [],
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["my-posts"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/posts/mine`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return res.json();
    },
    enabled: !!accessToken,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-500">Loading your posts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-10">
      {/* USER INFO + SIGNOUT */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={user.user_metadata?.avatar_url}
            alt="avatar"
            className="w-20 h-20 rounded-full border"
          />
          <div>
            <h1 className="text-3xl font-bold">
              {user.user_metadata?.full_name || "Your Profile"}
            </h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        <Button variant="destructive" onClick={async () => {
          await signOut();
          navigate("/");
        }}>
          Sign Out
        </Button>
      </div>

      <hr className="my-6" />

      {/* POSTS */}
      <h2 className="text-2xl font-bold mb-6">Your Posts</h2>

      {myPosts.length === 0 ? (
        <p className="text-gray-500">You have posted nothing yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {myPosts.map((post) => (
            <ProjectCard
              key={post.id}
              image={post.cover_image_url}
              title={post.title}
              author={post.profiles?.full_name}
              techStack={
                post.tags?.join(", ") || (post.type === "project" ? "Project" : "Blog")
              }
              description={post.short_description}
              likes_count={post.likes_count}
              onClick={() =>
                navigate(
                  post.type === "project"
                    ? `/projects/${post.id}`
                    : `/blogs/${post.id}`
                )
              }
              onUpvote={async () => {
                await upvotePost(post.id, accessToken, API_URL);
                refetch();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
