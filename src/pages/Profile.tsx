import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

import { ProjectCard } from "../components/ui/project-card";

export default function Profile() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [myBlogs, setMyBlogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) console.log("Profile fetch error:", error.message);
      else setProfile(data);
    }

    async function loadMyPosts() {
      if (!user) return;

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.log("Fetch posts error:", error.message);
      else {
        setMyProjects(data.filter((p: any) => p.type === "project"));
        setMyBlogs(data.filter((p: any) => p.type === "blog"));
      }
    }

    loadProfile();
    loadMyPosts();
  }, [user]);

  // ------------------------------------------
  // NOT SIGNED IN VIEW (perfectly centered)
  // ------------------------------------------
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <h2 className="text-xl font-semibold mb-4">You are not signed in</h2>
        <Button onClick={signInWithGoogle}>Sign in</Button>
      </div>
    );
  }

  // ------------------------------------------
  // LOADING PROFILE
  // ------------------------------------------
  if (!profile) {
    return <p className="text-center mt-20">Loading profile...</p>;
  }

  // ------------------------------------------
  // SIGNED IN VIEW
  // ------------------------------------------
  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar_url}
            className="w-20 h-20 rounded-full border object-cover"
          />

          <div>
            <h1 className="text-3xl font-bold">{profile.full_name}</h1>
            <p className="text-gray-500">@{profile.username}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => navigate("/edit-profile")}>Edit Profile</Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* BIO */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold">Bio</h2>
        <p className="text-gray-700">{profile.bio}</p>
      </div>

      {/* SKILLS */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Skills</h2>

        {(!profile.skills || profile.skills.length === 0) && (
          <p className="text-gray-500">No skills added.</p>
        )}

        <div className="flex flex-wrap gap-2">
          {profile.skills?.map((skill: string, i: number) => (
            <span
              key={i}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* WEBSITE */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold">Website</h2>
        <a
          href={profile.website}
          target="_blank"
          className="text-blue-600 underline"
        >
          {profile.website}
        </a>
      </div>

      {/* PROJECTS */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">My Projects</h2>

        {myProjects.length === 0 ? (
          <p className="text-gray-500">You have not posted any projects yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {myProjects.map((p) => (
              <ProjectCard
                key={p.id}
                image={p.cover_image_url}
                title={p.title}
                author={profile.full_name}
                techStack={p.tags?.join(", ") || ""}
                description={p.short_description}
                likes_count={p.likes_count}
                onUpvote={() => {}}
                onClick={() => navigate(`/projects/${p.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* BLOGS */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">My Blogs</h2>

        {myBlogs.length === 0 ? (
          <p className="text-gray-500">You have not posted any blogs yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {myBlogs.map((b) => (
              <ProjectCard
                key={b.id}
                image={b.cover_image_url || "/default-blog.png"}
                title={b.title}
                author={profile.full_name}
                techStack={b.tags?.join(", ") || ""}
                description={b.short_description}
                likes_count={b.likes_count}
                onUpvote={() => {}}
                onClick={() => navigate(`/blogs/${b.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
