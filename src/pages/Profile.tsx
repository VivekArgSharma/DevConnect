import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { ProjectCard } from "../components/ui/project-card";
import { LogOut, Edit, Star, Globe, Loader2 } from "lucide-react";

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

  // NOT SIGNED IN VIEW
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">Welcome back</h2>
          <p className="text-muted-foreground mb-6">Sign in to view your profile and manage your projects</p>
          <Button onClick={signInWithGoogle} size="lg" className="w-full max-w-xs">
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  // LOADING PROFILE
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading profile...</p>
      </div>
    );
  }

  // SIGNED IN VIEW
  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={profile.avatar_url}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-border object-cover"
              alt={profile.full_name}
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{profile.full_name}</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => navigate("/edit-profile")} variant="secondary" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
            <Button variant="outline" onClick={() => navigate("/starred")} className="gap-2">
              <Star className="w-4 h-4" />
              Starred
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-foreground/90 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-lg"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Website */}
        {profile.website && (
          <div className="mt-6 pt-6 border-t border-border">
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Globe className="w-4 h-4" />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {/* Projects Section */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">My Projects</h2>
          <span className="text-sm text-muted-foreground">{myProjects.length} projects</span>
        </div>

        {myProjects.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">You haven't posted any projects yet.</p>
            <Button onClick={() => navigate("/post")} variant="subtle" className="mt-4">
              Create your first project
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
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
      </section>

      {/* Blogs Section */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">My Blogs</h2>
          <span className="text-sm text-muted-foreground">{myBlogs.length} blogs</span>
        </div>

        {myBlogs.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">You haven't posted any blogs yet.</p>
            <Button onClick={() => navigate("/post")} variant="subtle" className="mt-4">
              Write your first blog
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
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
      </section>
    </div>
  );
}
