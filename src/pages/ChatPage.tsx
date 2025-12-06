// ChatPage.tsx

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
      // --- GET SESSION ---
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        alert("Please login to view chat.");
        navigate("/login");
        return;
      }

      const token = session.access_token;

      // --- CONNECT SOCKET (OR REUSE EXISTING) ---
      const socket =
        getSocket() ||
        createSocket(token, import.meta.env.VITE_CHAT_SERVER_URL || "http://localhost:4000");

      socketRef.current = socket;

      // --- IMPORTANT: REMOVE OLD LISTENERS ---
      socket.off("message");
      socket.off("chat_deleted");

      // --- MESSAGE LISTENER ---
      socket.on("message", (msg: any) => {
        if (msg.chat_id === chatId) {
          setMessages((prev) => {
            // Prevent duplicate messages with same ID
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      });

      // --- CHAT DELETED LISTENER ---
      socket.on("chat_deleted", (payload: any) => {
        if (payload.chat_id === chatId) {
          alert("This chat was deleted.");
          navigate("/");
        }
      });

      // --- INITIAL MESSAGES FETCH ---
      try {
        const resp = await axios.get(
          `${import.meta.env.VITE_CHAT_SERVER_URL}/chat/${chatId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Deduplicate messages just in case
        const uniqueMessages = (resp.data.messages || []).filter(
          (v: any, i: number, arr: any[]) => arr.findIndex((m) => m.id === v.id) === i
        );

        setMessages(uniqueMessages);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }

      setLoading(false);
    }

    init();

    return () => {
      // CLEANUP (optional)
      if (socketRef.current) {
        socketRef.current.off("message");
        socketRef.current.off("chat_deleted");
      }
    };
  }, [chatId, navigate]);

  // --- SEND MESSAGE ---
  async function handleSend(content: string) {
    const socket = socketRef.current || getSocket();
    if (!socket) {
      alert("Not connected to chat server.");
      return;
    }

    return new Promise((resolve) => {
      socket.emit(
        "send_message",
        { chat_id: chatId, content },
        (ack: any) => {
          if (ack?.message) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === ack.message.id)) return prev;
              return [...prev, ack.message];
            });
          }
          resolve(ack);
        }
      );
    });
  }

  // --- DELETE CHAT ---
  async function handleDeleteChat() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) return;
    if (!window.confirm("Delete this chat and all messages?")) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_CHAT_SERVER_URL}/chat/${chatId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      alert("Chat deleted.");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Could not delete chat.");
    }
  }

  if (loading) return <div>Loading chat...</div>;

  return (
    <div className="max-w-3xl mx-auto h-screen flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="text-lg font-semibold">Chat</div>

        <button
          onClick={handleDeleteChat}
          className="px-3 py-1 bg-red-600 text-white rounded"
        >
          Delete chat
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-auto p-4">
        <ChatWindow messages={messages} />
      </div>

      {/* INPUT */}
      <MessageComposer onSend={handleSend} />
    </div>
  );
}

/* ------------------------------------------
   MESSAGE COMPOSER (INPUT BOX)
------------------------------------------- */
function MessageComposer({ onSend }: { onSend: (msg: string) => Promise<any> }) {
  const [text, setText] = useState("");
  const sendingRef = useRef(false);

  async function send() {
    if (!text.trim() || sendingRef.current) return;

    sendingRef.current = true;
    await onSend(text.trim());
    setText("");
    sendingRef.current = false;
  }

  return (
    <div className="p-4 border-t flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        className="flex-1 border rounded p-2"
        placeholder="Type a message..."
      />

      <button onClick={send} className="px-3 py-2 bg-blue-600 text-white rounded">
        Send
      </button>
    </div>
  );
}
