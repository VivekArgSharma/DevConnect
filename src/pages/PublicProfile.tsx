import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ProjectCard } from "@/components/ui/project-card";

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
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      setProfile(profileData);

      // Load posts
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);
      setLoading(false);
    };

    load();
  }, [userId]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!profile) return <p className="text-center mt-10">User not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">

      {/* --- Header Section --- */}
      <div className="flex items-center gap-4">
        <img
          src={profile.avatar_url || "/default-avatar.png"}
          className="w-24 h-24 rounded-full border"
        />
        <div>
          <h2 className="text-2xl font-bold">{profile.full_name}</h2>
          <p className="text-gray-600">@{profile.username}</p>
        </div>
      </div>

      {/* --- Bio --- */}
      {profile.bio && (
        <div className="mt-6 p-4 bg-white border rounded-lg">
          <h3 className="font-semibold mb-2">Bio</h3>
          <p>{profile.bio}</p>
        </div>
      )}

      {/* --- Skills Tags --- */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="mt-6 p-4 bg-white border rounded-lg">
          <h3 className="font-semibold mb-2">Skills</h3>

          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span
                key={s}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* --- Website --- */}
      {profile.website && (
        <div className="mt-6 p-4 bg-white border rounded-lg">
          <h3 className="font-semibold mb-2">Website</h3>
          <a
            href={profile.website}
            target="_blank"
            className="text-blue-600 underline break-all"
          >
            {profile.website}
          </a>
        </div>
      )}

      {/* --- Posts --- */}
      <div className="mt-10 mb-16">
        <h3 className="text-xl font-bold mb-4">Posts</h3>

        {posts.length === 0 ? (
          <p className="text-gray-500">This user has not posted anything yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {posts.map((post) => (
              <ProjectCard
                key={post.id}
                image={post.cover_image_url || "/default-blog.png"}
                title={post.title}
                author={profile.full_name || ""}
                techStack={post.tags?.join(", ") || ""}
                description={post.short_description}
                likes_count={post.likes_count}
                onUpvote={() => {}}
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
  );
}
