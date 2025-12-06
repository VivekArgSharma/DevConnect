import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function ChatWindow({ messages }: { messages: any[] }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id || null);
    });
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {messages.map((msg) => {
        const isMe = msg.sender_id === currentUserId;

        return (
          <div
            key={msg.id}
            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-xl shadow-sm 
              ${isMe ? "bg-green-500 text-white rounded-br-none" 
                     : "bg-gray-200 text-black rounded-bl-none"}`}
            >
              <div className="font-semibold text-sm mb-1">
                {msg.sender_name}
              </div>
              <div>{msg.content}</div>
              <div className="text-[10px] opacity-70 mt-1">
                {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
