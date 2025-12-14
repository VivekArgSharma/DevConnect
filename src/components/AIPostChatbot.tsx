import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL as string;

interface Props {
  context: string;
}

export default function AIPostChatbot({ context }: Props) {
  const { accessToken, user } = useAuth();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 👇 Ref for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 👇 Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;

    if (!user || !accessToken) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Please log in to use the AI assistant." },
      ]);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/ai/chat`,
        { message: text, context },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: res.data.reply },
      ]);
    } catch (err) {
      console.error("AI error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "AI failed to respond. Please try again." },
      ]);
    }

    setLoading(false);
  }

  return (
    <>
      {/* 🤖 Floating Button */}
      <button
        onClick={() => setOpen((s) => !s)}
        className="fixed bottom-6 right-6 z-50 bg-black text-white p-4 rounded-full shadow-lg"
        title="Ask AI"
      >
        🤖
      </button>

      {/* 💬 Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[420px] bg-white border rounded-xl shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-3 font-semibold border-b shrink-0">
            AI Post Assistant
          </div>

          {/* Messages (SCROLLABLE) */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm">
            <button
              onClick={() => sendMessage("Summarize this post")}
              className="bg-gray-200 px-2 py-1 rounded text-xs"
            >
              Summarize this post
            </button>

            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "text-right text-blue-600"
                    : "text-left text-gray-800"
                }
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div className="text-gray-400">Thinking…</div>
            )}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input (FIXED) */}
          <div className="p-2 border-t flex gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this post..."
              className="flex-1 border px-2 py-1 rounded text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage(input);
                  setInput("");
                }
              }}
            />
            <button
              onClick={() => {
                sendMessage(input);
                setInput("");
              }}
              className="bg-black text-white px-3 rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
