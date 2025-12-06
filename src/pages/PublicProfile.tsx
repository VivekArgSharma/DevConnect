console.log("CHAT SERVER ENV:", import.meta.env.VITE_CHAT_SERVER_URL);

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ProjectCard } from "@/components/ui/project-card";
import FollowButton from "@/components/FollowButton";
import axios from "axios";

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
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ------------------------------
  // LOAD CURRENT USER SESSION PROPERLY
  // ------------------------------
  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setCurrentUserId(data.session?.user?.id || null);
    }
    loadSession();
  }, []);

  // ------------------------------
  // LOAD PROFILE & POSTS
  // ------------------------------
  useEffect(() => {
    if (!userId) return;

    const load = async () => {
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

      setPosts(postsData);
    };

    load();
  }, [userId]);

  if (!profile) {
    return <div className="p-6">Loading...</div>;
  }

  // ------------------------------
  // DM HANDLER
  // ------------------------------
  async function handleDM() {
    const sessionRes = await supabase.auth.getSession();
    const token = sessionRes.data.session?.access_token;

    console.log("FRONTEND TOKEN:", token); // Debug log

    if (!token) {
      alert("Please sign in to send a message.");
      return;
    }

    try {
      console.log(
        "Calling:",
        `${import.meta.env.VITE_CHAT_SERVER_URL}/chat/open`
      );

      const resp = await axios.post(
        `${import.meta.env.VITE_CHAT_SERVER_URL}/chat/open`,
        { other_user_id: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const chatId = resp.data.chat_id;
      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error("DM ERROR:", error);
      alert("Could not open chat.");
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatar_url || "/default-avatar.png"}
              className="w-20 h-20 rounded-full object-cover"
              alt="avatar"
            />
            <div>
              <h2 className="text-2xl font-bold">{profile.full_name}</h2>
              <p className="text-gray-600">@{profile.username}</p>
            </div>
          </div>

          {/* Right-side buttons */}
          <div className="flex gap-3">
            {userId && <FollowButton targetUserId={userId} />}

            {/* Show DM button only if viewing someone else's profile */}
            {currentUserId && currentUserId !== userId && (
              <button
                onClick={handleDM}
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                DM
              </button>
            )}
          </div>
        </div>

        {/* BIO */}
        {profile.bio && (
          <div className="mt-6 p-4 bg-white border rounded-lg">
            <p className="text-sm text-slate-700">{profile.bio}</p>
          </div>
        )}

        {/* WEBSITE + SKILLS */}
        <div className="mt-4 flex flex-wrap gap-3">
          {profile.website && (
            <a
              className="text-sm text-sky-600"
              href={profile.website}
              target="_blank"
              rel="noreferrer"
            >
              {profile.website}
            </a>
          )}

          {profile.skills?.map((s) => (
            <span key={s} className="text-xs bg-slate-100 px-2 py-1 rounded">
              {s}
            </span>
          ))}
        </div>

        {/* POSTS */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Posts</h3>

          {posts?.length === 0 && (
            <div className="text-sm text-slate-500">
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
  );
}
