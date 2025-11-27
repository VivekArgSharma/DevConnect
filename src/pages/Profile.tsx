import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log("Profile fetch error:", error.message);
      } else {
        setProfile(data);
      }
    }

    loadProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold">You are not signed in</h2>
        <Button onClick={signInWithGoogle}>Sign in</Button>
      </div>
    );
  }

  if (!profile) {
    return <p className="text-center mt-10">Loading profile...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar_url}
            className="w-20 h-20 rounded-full border"
          />
          <div>
            <h1 className="text-3xl font-bold">{profile.full_name}</h1>
            <p className="text-gray-500">@{profile.username}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => navigate("/edit-profile")}>Edit Profile</Button>

          <Button
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
            variant="destructive"
          >
            Sign Out
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Bio</h2>
        <p className="text-gray-700">{profile.bio}</p>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Skills</h2>
        <p className="text-gray-700">{profile.skills?.join(", ")}</p>
      </div>

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
    </div>
  );
}
