import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface ChatItem {
  chat_id: string;
  other_user_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
}

export default function Chats() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadChats() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) return;

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
      }

      setLoading(false);
    }

    loadChats();
  }, []);

  if (loading) return <div className="p-6">Loading chats...</div>;

  if (chats.length === 0)
    return <div className="p-6 text-gray-500">No chats yet.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Chats</h1>

      <div className="flex flex-col gap-3">
        {chats.map((chat) => (
          <div
            key={chat.chat_id}
            onClick={() => navigate(`/chat/${chat.chat_id}`)}
            className="flex items-center gap-4 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <img
              src={chat.avatar_url || "/default-avatar.png"}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="font-semibold">{chat.other_user_name}</div>
              <div className="text-sm text-gray-600 truncate">
                {chat.last_message}
              </div>
            </div>

            <div className="text-xs text-gray-400">
              {new Date(chat.last_message_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
