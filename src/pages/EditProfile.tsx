// src/pages/EditProfile.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {supabase} from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/profile"); // redirect if not logged in
      return;
    }
    const load = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const row = data as ProfileRow | null;
        if (row) {
          setFullName(row.full_name ?? "");
          setUsername(row.username ?? "");
          setBio(row.bio ?? "");
          setWebsite(row.website ?? "");
          setAvatarUrl(row.avatar_url ?? null);
          setSkills(row.skills ?? []);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate]);

  // add tag when pressing Enter or comma
  const addTag = (value?: string) => {
    const v = (value ?? tagInput).trim();
    if (!v) return;
    if (!skills.includes(v)) {
      setSkills((s) => [...s, v]);
    }
    setTagInput("");
  };

  const removeTag = (t: string) => {
    setSkills((s) => s.filter((x) => x !== t));
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const bucket = "avatars";
    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    try {
      setSaving(true);
      // upload
      const up = await supabase.storage.from(bucket).upload(filePath, file, {
        upsert: true,
      });

      // check error shape
      // @ts-ignore
      if (up.error) throw up.error;

      // get public url
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = (urlData as any)?.publicUrl ?? null;

      if (publicUrl) {
        setAvatarUrl(publicUrl);
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload avatar. See console.");
    } finally {
      setSaving(false);
      // clear input so same file can be reselected later
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: Partial<ProfileRow> = {
        full_name: fullName || null,
        username: username || null,
        bio: bio || null,
        website: website || null,
        avatar_url: avatarUrl || null,
        skills: skills.length ? skills : [],
      };

      // update profile row
      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

      if (error) throw error;
      navigate("/profile");
    } catch (err) {
      console.error("Failed to save profile", err);
      alert("Failed to save profile. See console.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Edit Profile</h2>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Avatar</label>
          <div className="flex items-center gap-4">
            <img
              src={avatarUrl || "/default-avatar.png"}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover border"
            />
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Unique handle (optional)</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Website</label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Skills / Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Type a skill and press Enter"
              className="border rounded px-2 py-1 flex-1"
            />
            <Button onClick={() => addTag()}>Add</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {skills.map((t) => (
              <div
                key={t}
                className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2"
              >
                <span className="text-sm">{t}</span>
                <button className="text-xs text-red-500" onClick={() => removeTag(t)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button variant="ghost" onClick={() => navigate("/profile")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
