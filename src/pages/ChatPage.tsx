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
  const [realtimeReady, setRealtimeReady] = useState(false);

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
     Load existing messages (authoritative)
  ------------------------- */
  useEffect(() => {
    if (!chatId || !userId) return;

    let cancelled = false;

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

      if (!cancelled) {
        setMessages((data as Message[]) || []);
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [chatId, userId]);

  /* -------------------------
     Realtime subscription (WhatsApp-style)
  ------------------------- */
  useEffect(() => {
    if (!chatId || !userId) return;

    setRealtimeReady(false);

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

          setMessages((prev) => {
            // Deduplicate (important for optimistic UI)
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeReady(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, userId]);

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

    const optimisticId = crypto.randomUUID();

    const optimisticMessage: Message = {
      id: optimisticId,
      chat_id: chatId,
      sender_id: userId,
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    // 1️⃣ Show immediately
    setMessages((prev) => [...prev, optimisticMessage]);
    setText("");

    // 2️⃣ Persist
    const { error } = await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: userId,
      content: optimisticMessage.content,
    });

    if (error) {
      // rollback
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
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
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg">Chat</h2>
        <button
          onClick={deleteChat}
          className="text-sm text-red-500 hover:underline"
        >
          Delete chat
        </button>
      </div>

      {/* MESSAGES */}
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

      {/* INPUT */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border rounded px-3 py-2"
          placeholder={
            realtimeReady
              ? "Type a message..."
              : "Connecting to chat..."
          }
          disabled={!realtimeReady}
        />
        <button
          onClick={sendMessage}
          disabled={!realtimeReady}
          className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
