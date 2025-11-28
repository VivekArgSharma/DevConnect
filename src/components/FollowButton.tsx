// src/components/FollowButton.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { checkIsFollowing, followUser, unfollowUser } from "@/lib/follows";

export default function FollowButton({ targetUserId }: { targetUserId: string }) {
  const { user } = useAuth() as any;
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      const res = await checkIsFollowing(user.id, targetUserId);
      if (!mounted) return;
      if (res && (res as any).following !== undefined) {
        setFollowing((res as any).following);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, targetUserId]);

  async function toggleFollow() {
    if (!user) {
      // optionally show a toast or redirect to login
      return;
    }
    setLoading(true);
    try {
      if (following) {
        await unfollowUser(user.id, targetUserId);
        setFollowing(false);
      } else {
        await followUser(user.id, targetUserId);
        setFollowing(true);
      }
    } catch (e) {
      console.error("Follow toggle error", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={toggleFollow} disabled={loading} className="px-3 py-1 text-sm">
      {following ? "Unfollow" : "Follow"}
    </Button>
  );
}
