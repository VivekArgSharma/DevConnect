import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Loader2 } from "lucide-react";

interface ChatItem {
  chat_id: string;
  other_user_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function Chats() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadChats() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_CHAT_SERVER_URL}/chats`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        setChats(res.data.chats || []);
      } catch (err) {
        console.error("Failed to load chats", err);
      } finally {
        setLoading(false);
      }
    }

    loadChats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading chats...</p>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">No chats yet</h2>
          <p className="text-muted-foreground">Start a conversation by messaging another developer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">{chats.length} conversation{chats.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex flex-col gap-2">
        {chats.map((chat) => (
          <div
            key={chat.chat_id}
            onClick={() => navigate(`/chat/${chat.chat_id}`)}
            className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="relative">
              <img
                src={chat.avatar_url || "/default-avatar.png"}
                className="w-12 h-12 rounded-full object-cover border border-border"
                alt={chat.other_user_name}
              />
              {chat.unread_count > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {chat.unread_count}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`font-semibold text-foreground ${chat.unread_count > 0 ? '' : ''}`}>
                  {chat.other_user_name}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {new Date(chat.last_message_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className={`text-sm truncate mt-0.5 ${chat.unread_count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                {chat.last_message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
