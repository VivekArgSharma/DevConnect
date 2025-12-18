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

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setCurrentUserId(data.session?.user?.id || null);
    }
    loadSession();
  }, []);

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
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-zinc-400 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  async function handleDM() {
    const sessionRes = await supabase.auth.getSession();
    const token = sessionRes.data.session?.access_token;

    if (!token) {
      alert("Please sign in to send a message.");
      return;
    }

    try {
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
    <div className="min-h-screen bg-[#0a0a0b] py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Main Profile Card */}
        <div className="bg-[#111113] border border-zinc-800/50 rounded-2xl p-8 shadow-2xl shadow-black/20">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src={profile.avatar_url || "/default-avatar.png"}
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-zinc-700/50"
                  alt="avatar"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-[#111113]" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">
                  {profile.full_name}
                </h2>
                <p className="text-zinc-500 text-sm mt-0.5">@{profile.username}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {userId && <FollowButton targetUserId={userId} />}

              {currentUserId && currentUserId !== userId && (
                <button
                  onClick={handleDM}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 text-sm font-medium 
                           hover:bg-zinc-700 transition-all duration-200 
                           border border-zinc-700/50 hover:border-zinc-600"
                >
                  Message
                </button>
              )}
            </div>
          </div>

          {/* Bio Section */}
          {profile.bio && (
            <div className="mt-8 p-5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
              <p className="text-zinc-300 text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Website & Skills */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {profile.website && (
              <a
                className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 
                         transition-colors duration-200"
                href={profile.website}
                target="_blank"
                rel="noreferrer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}

            {profile.skills?.map((s) => (
              <span
                key={s}
                className="text-xs font-medium bg-zinc-800/80 text-zinc-400 px-3 py-1.5 rounded-lg
                         border border-zinc-700/30"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Posts Section */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-lg font-semibold text-zinc-100">Posts</h3>
            {posts && posts.length > 0 && (
              <span className="text-xs font-medium bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md">
                {posts.length}
              </span>
            )}
          </div>

          {posts?.length === 0 && (
            <div className="bg-[#111113] border border-zinc-800/50 rounded-xl p-12 text-center">
              <div className="text-zinc-600 text-sm">No posts yet</div>
            </div>
          )}

          {posts && posts.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {posts.map((post: any) => (
                <div
                  key={post.id}
                  className="bg-[#111113] border border-zinc-800/50 rounded-xl 
                           hover:border-zinc-700/50 transition-all duration-200 overflow-hidden"
                >
                  <ProjectCard
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
