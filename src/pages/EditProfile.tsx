import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Button } from "../components/ui/button";
import Squares from "@/components/ui/Squares";

type ProfileRow = {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  website?: string | null;
  skills?: string[] | null;
};

export default function EditProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");

  // SKILL TAGS
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setWebsite(data.website || "");
        setSkills(data.skills || []);
        setAvatarPreview(data.avatar_url || null);
      }

      setLoading(false);
    })();
  }, [navigate]);

  // Preview avatar when selecting a file
  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  /** Extract file path from public URL */
  function extractFilePath(url: string | null): string | null {
    if (!url) return null;

    try {
      const u = new URL(url);
      const path = u.pathname;

      const prefix = "/storage/v1/object/public/avatars/";
      const idx = path.indexOf(prefix);

      if (idx === -1) return null;

      return path.substring(idx + prefix.length);
    } catch {
      return null;
    }
  }

  /** Upload avatar + delete old one */
  async function uploadAvatar(userId: string, oldAvatarUrl: string | null) {
    if (!avatarFile) return oldAvatarUrl;

    // 1. delete old avatar if exists
    const oldFilePath = extractFilePath(oldAvatarUrl);
    if (oldFilePath) {
      await supabase.storage.from("avatars").remove([oldFilePath]);
      console.log("Deleted old avatar:", oldFilePath);
    }

    // 2. upload new avatar
    const filename = `avatar-${userId}-${Date.now()}`;
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(filename, avatarFile);

    if (error) throw error;

    // 3. get public URL
    const { data: publicURL } = supabase.storage
      .from("avatars")
      .getPublicUrl(data.path);

    return publicURL.publicUrl;
  }

  // Add skill on ENTER
  const handleSkillKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim() !== "") {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter((x) => x !== s));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) return;

    try {
      // Upload avatar + delete old one
      const avatar_url = await uploadAvatar(user.id, profile?.avatar_url ?? null);

      const updates = {
        id: user.id,
        full_name: fullName,
        username: username,
        bio: bio,
        website: website,
        skills: skills,
        avatar_url,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(updates, { onConflict: "id" });

      if (error) throw error;

      navigate("/profile");
    } catch (err) {
      console.log("Save error:", err);
    }

    setLoading(false);
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
      <div className="max-w-3xl mx-auto py-12 px-4 relative">
        <h1 className="text-2xl font-semibold mb-6 text-foreground">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card/80 backdrop-blur-sm p-6 rounded-xl border border-border">

          {/* AVATAR */}
          <div>
            <label className="block mb-2 font-medium text-foreground">Avatar</label>

            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border border-border bg-secondary">
                {avatarPreview ? (
                  <img src={avatarPreview} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                className="text-foreground"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* FULL NAME */}
          <div>
            <label className="block mb-1 text-foreground">Full Name</label>
            <input
              className="w-full border border-border bg-background text-foreground rounded px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* USERNAME */}
          <div>
            <label className="block mb-1 text-foreground">Username</label>
            <input
              className="w-full border border-border bg-background text-foreground rounded px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* BIO */}
          <div>
            <label className="block mb-1 text-foreground">Bio</label>
            <textarea
              className="w-full border border-border bg-background text-foreground rounded px-3 py-2"
              value={bio}
              rows={3}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* WEBSITE */}
          <div>
            <label className="block mb-1 text-foreground">Website</label>
            <input
              className="w-full border border-border bg-background text-foreground rounded px-3 py-2"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {/* SKILLS */}
          <div>
            <label className="block mb-1 text-foreground">Skills</label>

            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map((s) => (
                <div
                  key={s}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full flex items-center gap-2"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="text-destructive font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <input
              className="w-full border border-border bg-background text-foreground rounded px-3 py-2"
              placeholder="Type skill and press Enter"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKey}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>

            <Button type="button" variant="secondary" onClick={() => navigate("/profile")}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
