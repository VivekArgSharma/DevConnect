// src/pages/EditProfile.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Button } from "../components/ui/button";

type ProfileRow = {
  id: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  website?: string | null;
  skills?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
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
  const [skillsText, setSkillsText] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("Not signed in.");
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log("Profile not found, will create new one:", error.message);
        setLoading(false);
        return;
      }

      setProfile(data);
      setFullName(data.full_name ?? "");
      setUsername(data.username ?? "");
      setBio(data.bio ?? "");
      setWebsite(data.website ?? "");
      setSkillsText((data.skills && data.skills.join(", ")) ?? "");
      setAvatarPreview(data.avatar_url ?? null);
      setLoading(false);
    })();
  }, [navigate]);

  // preview image
  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  // avatar upload handler
  async function uploadAvatar(userId: string) {
    if (!avatarFile) return null;

    const filename = `avatar-${userId}-${Date.now()}-${avatarFile.name}`;

    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(filename, avatarFile);

    if (error) {
      console.log("Avatar upload error:", error);
      throw error;
    }

    const { data: publicURL } = supabase.storage
  .from("avatars")
  .getPublicUrl(data.path);

if (!publicURL) {
  console.log("Failed to get public URL");
  return null;
}

return publicURL.publicUrl;

  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("Not signed in.");
      setLoading(false);
      return;
    }

    try {
      let avatar_url = profile?.avatar_url ?? null;

      if (avatarFile) {
        avatar_url = await uploadAvatar(user.id);
      }

      const skills = skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const updates = {
        id: user.id,
        full_name: fullName || null,
        username: username || null,
        avatar_url,
        bio: bio || null,
        website: website || null,
        skills,
        updated_at: new Date().toISOString(),
      };

      // First try updating
      const { error: updateErr } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (updateErr) {
        console.log("Update error:", updateErr);

        // if row does not exist → insert new one
        const { error: insertErr } = await supabase
          .from("profiles")
          .insert(updates);

        if (insertErr) {
          console.log("Insert error:", insertErr);
          throw insertErr;
        }
      }

      console.log("Profile saved.");
      navigate("/profile");
    } catch (err) {
      console.log("Save failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium mb-2">Avatar</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border bg-gray-200">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  className="w-full h-full object-cover"
                  alt="avatar"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div>
          <label className="block mb-1">Full Name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Username</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Bio</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Website</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Skills (comma separated)</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button disabled={loading} type="submit">
            {loading ? "Saving..." : "Save Profile"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/profile")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
