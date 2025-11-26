import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {supabase} from "@/lib/supabaseClient";

interface Profile {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
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

  if (loading) return <p>Loading...</p>;
  if (!profile) return <p>User not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">

      <div className="flex items-center gap-4">
        <img
          src={profile.avatar_url || "/default-avatar.png"}
          className="w-24 h-24 rounded-full"
        />
        <div>
          <h2 className="text-2xl font-bold">{profile.full_name}</h2>
          <p className="text-gray-600">@{profile.username}</p>
        </div>
      </div>

      {profile.bio && (
        <div className="mt-6 p-4 bg-white border rounded">
          <h3 className="font-semibold mb-2">About</h3>
          <p>{profile.bio}</p>
        </div>
      )}

      <div className="mt-10">
        <h3 className="text-xl font-bold mb-4">Posts</h3>

        {posts.length === 0 ? (
          <p className="text-gray-500">This user has not posted anything yet.</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="border p-4 rounded-lg mb-3 cursor-pointer"
              onClick={() =>
                navigate(post.type === "blog" ? `/blogs/${post.id}` : `/projects/${post.id}`)
              }
            >
              <h4 className="font-semibold">{post.title}</h4>
              <p className="text-sm text-gray-600">{post.short_description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
