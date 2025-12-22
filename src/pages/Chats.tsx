import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import Squares from "@/components/ui/Squares";

type ChatPreview = {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
  avatarUrl: string | null;
  lastMessage: string;
  createdAt: string;
};

export default function Chats() {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadChats() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // 1️⃣ Get latest message per chat
      const { data: messages, error } = await supabase
        .from("messages")
        .select("chat_id, content, created_at")
        .like("chat_id", `%${user.id}%`)
        .order("created_at", { ascending: false });

      if (error || !messages) {
        console.error(error);
        setLoading(false);
        return;
      }

      // 2️⃣ Deduplicate by chat_id (keep latest message)
      const seen = new Set<string>();
      const latestPerChat = messages.filter((m) => {
        if (seen.has(m.chat_id)) return false;
        seen.add(m.chat_id);
        return true;
      });

      // 3️⃣ Resolve other user + profile
      const previews: ChatPreview[] = [];

      for (const msg of latestPerChat) {
        const [a, b] = msg.chat_id.split("_");
        const otherUserId = a === user.id ? b : a;

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", otherUserId)
          .single();

        previews.push({
          chatId: msg.chat_id,
          otherUserId,
          otherUserName: profile?.full_name ?? "Unknown",
          avatarUrl: profile?.avatar_url ?? null,
          lastMessage: msg.content,
          createdAt: msg.created_at,
        });
      }

      setChats(previews);
      setLoading(false);
    }

    loadChats();
  }, []);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading chats…</div>;
  }

  if (chats.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        No conversations yet
      </div>
    );
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

      <div className="max-w-2xl mx-auto p-4 space-y-2">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>

        {chats.map((chat) => (
          <div
            key={chat.chatId}
            onClick={() => navigate(`/chat/${chat.otherUserId}`)}
            className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-secondary transition"
          >
            <img
              src={chat.avatarUrl || "/default-avatar.png"}
              className="w-12 h-12 rounded-full object-cover"
              alt={chat.otherUserName}
            />

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-semibold truncate">
                  {chat.otherUserName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(chat.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="text-sm text-muted-foreground truncate">
                {chat.lastMessage}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
