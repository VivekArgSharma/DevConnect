import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import { createSocket, getSocket } from "@/utils/socket";
import { supabase } from "@/lib/supabaseClient";
import ChatWindow from "@/components/ChatWindow";

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        alert("Please login to view chat.");
        navigate("/login");
        return;
      }

      const token = session.access_token;

      const socket =
        getSocket() ||
        createSocket(
          token,
          import.meta.env.VITE_CHAT_SERVER_URL || "http://localhost:4000"
        );

      socketRef.current = socket;

      socket.off("message");

      socket.on("message", (msg: any) => {
        if (msg.chat_id === chatId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      });

      try {
        const resp = await axios.get(
          `${import.meta.env.VITE_CHAT_SERVER_URL}/chat/${chatId}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setMessages(resp.data.messages || []);

        // ✅ ✅ ✅ THIS LINE FIXES YOUR UNREAD BADGE INSTANTLY
        window.dispatchEvent(new Event("chat-read"));

      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      socketRef.current?.off("message");
    };
  }, [chatId, navigate]);

  async function handleSend(content: string) {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("send_message", { chat_id: chatId, content });
  }

  async function handleDeleteChat() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) return;
    if (!window.confirm("Delete this chat?")) return;

    await axios.delete(
      `${import.meta.env.VITE_CHAT_SERVER_URL}/chat/${chatId}`,
      {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }
    );

    navigate("/chats");
  }

  if (loading) return <div className="p-6">Loading chat...</div>;

  return (
    <div className="max-w-3xl mx-auto h-screen flex flex-col">
      <div className="flex justify-between p-3 border-b">
        <div className="font-semibold">Chat</div>
        <button
          onClick={handleDeleteChat}
          className="px-3 py-1 bg-red-600 text-white rounded"
        >
          Delete chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ChatWindow messages={messages} />
      </div>

      <MessageComposer onSend={handleSend} />
    </div>
  );
}

function MessageComposer({ onSend }: { onSend: (msg: string) => void }) {
  const [text, setText] = useState("");

  function send() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div className="border-t p-4 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        className="flex-1 border p-2 rounded"
        placeholder="Type a message..."
      />
      <button onClick={send} className="bg-blue-600 text-white px-4 rounded">
        Send
      </button>
    </div>
  );
}
