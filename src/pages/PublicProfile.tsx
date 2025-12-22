import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ProjectCard } from "@/components/ui/project-card";
import FollowButton from "@/components/FollowButton";
import Squares from "@/components/ui/Squares";

interface Profile {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  website?: string | null;
  skills?: string[] | null;
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  /* ------------------------------
     LOAD CURRENT USER SESSION
  ------------------------------ */
  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setCurrentUserId(data.session?.user?.id || null);
    }
    loadSession();
  }, []);

  /* ------------------------------
     LOAD PROFILE & POSTS
  ------------------------------ */
  useEffect(() => {
    if (!userId) return;

    async function load() {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      setProfile(profileData);

      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);
    }

    load();
  }, [userId]);

  if (!profile) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <>
      <div className="fixed inset-0 -z-10">
        <Squares
          direction="diagonal"
          speed={0.3}
          borderColor="hsl(var(--border) / 0.3)"
          squareSize={50}
          hoverFillColor="hsl(var(--primary) / 0.1)"
        />
      </div>

      <div className="p-6 max-w-4xl mx-auto relative">
        <div className="bg-card/80 backdrop-blur-sm p-6 rounded-lg border border-border">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={profile.avatar_url || "/default-avatar.png"}
                className="w-20 h-20 rounded-full object-cover border border-border"
                alt="avatar"
              />
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {profile.full_name}
                </h2>
                <p className="text-muted-foreground">
                  @{profile.username}
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">
              {userId && <FollowButton targetUserId={userId} />}

              {currentUserId && currentUserId !== userId && (
                <button
                  onClick={() => navigate(`/chat/${userId}`)}
                  className="px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  DM
                </button>
              )}
            </div>
          </div>

          {/* BIO */}
          {profile.bio && (
            <div className="mt-6 p-4 bg-secondary border border-border rounded-lg">
              <p className="text-sm text-foreground">{profile.bio}</p>
            </div>
          )}

          {/* WEBSITE + SKILLS */}
          <div className="mt-4 flex flex-wrap gap-3">
            {profile.website && (
              <a
                className="text-sm text-primary hover:underline"
                href={profile.website}
                target="_blank"
                rel="noreferrer"
              >
                {profile.website}
              </a>
            )}

            {profile.skills?.map((s) => (
              <span
                key={s}
                className="text-xs bg-secondary text-foreground px-2 py-1 rounded"
              >
                {s}
              </span>
            ))}
          </div>

          {/* POSTS */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3 text-foreground">
              Posts
            </h3>

            {posts?.length === 0 && (
              <div className="text-sm text-muted-foreground">
                This user has no posts yet.
              </div>
            )}

            {posts && (
              <div className="grid grid-cols-1 gap-4">
                {posts.map((post: any) => (
                  <ProjectCard
                    key={post.id}
                    image={post.image_url || "/placeholder.png"}
                    title={post.title}
                    description={post.excerpt || post.description || ""}
                    author={profile.full_name || ""}
                    techStack={post.tags?.join(", ")}
                    onClick={() =>
                      navigate(
                        post.type === "blog"
                          ? `/blogs/${post.id}`
                          : `/projects/${post.id}`
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
