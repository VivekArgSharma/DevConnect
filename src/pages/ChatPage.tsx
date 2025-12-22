import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

function getChatId(a: string, b: string) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export default function ChatPage() {
  const { otherUserId } = useParams<{ otherUserId: string }>();

  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const chatId = useMemo(() => {
    if (!userId || !otherUserId) return null;
    return getChatId(userId, otherUserId);
  }, [userId, otherUserId]);

  /* -------------------------
     Load current user
  ------------------------- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  /* -------------------------
     Load existing messages (PER-USER DELETE SAFE)
  ------------------------- */
  useEffect(() => {
    if (!chatId || !userId) return;

    async function loadMessages() {
      const { data: deletion } = await supabase
        .from("chat_deletions")
        .select("deleted_at")
        .eq("chat_id", chatId)
        .eq("user_id", userId)
        .maybeSingle();

      let query = supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (deletion?.deleted_at) {
        query = query.gt("created_at", deletion.deleted_at);
      }

      const { data } = await query;
      setMessages((data as Message[]) || []);
    }

    loadMessages();
  }, [chatId, userId]);

  /* -------------------------
     Realtime subscription
  ------------------------- */
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  /* -------------------------
     Auto-scroll
  ------------------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------------------------
     Send message (OPTIMISTIC)
  ------------------------- */
  async function sendMessage() {
    if (!text.trim() || !chatId || !userId) return;

    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      chat_id: chatId,
      sender_id: userId,
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setText("");

    const { error } = await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: userId,
      content: optimisticMessage.content,
    });

    if (error) {
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimisticMessage.id)
      );
      alert(error.message);
    }
  }

  /* -------------------------
     Delete chat (PER-USER, SAFE)
  ------------------------- */
  async function deleteChat() {
    if (!chatId || !userId) return;

    const confirmDelete = window.confirm(
      "Delete this chat? Messages will be removed only for you."
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("chat_deletions").upsert(
      {
        chat_id: chatId,
        user_id: userId,
        deleted_at: new Date().toISOString(),
      },
      {
        onConflict: "chat_id,user_id",
      }
    );

    if (error) {
      alert(error.message);
      return;
    }

    setMessages([]);
  }

  if (!otherUserId) {
    return <div className="p-6">Invalid chat</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg">Chat</h2>
        <button
          onClick={deleteChat}
          className="text-sm text-red-500 hover:underline"
        >
          Delete chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-4 border border-border rounded p-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[70%] px-3 py-2 rounded text-sm ${
              m.sender_id === userId
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-secondary text-foreground"
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 rounded bg-primary text-primary-foreground"
        >
          Send
        </button>
      </div>
    </div>
  );
}
