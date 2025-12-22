// src/components/DMButton.jsx
import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; // ✅ FIXED IMPORT

export default function DMButton({ otherUserId }) {
  const navigate = useNavigate();

  async function handleDM() {
    // ✅ Correct Supabase v2 session API
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      alert("Please login to send a DM.");
      return;
    }

    try {
      const resp = await axios.post(
        `${
          import.meta.env.VITE_CHAT_SERVER_URL || "http://localhost:4000"
        }/api/chat/open`,
        { other_user_id: otherUserId },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const chatId = resp.data.chat_id;
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error("DM open failed:", err);
      alert("Could not open DM. Try again.");
    }
  }

  return (
    <button
      onClick={handleDM}
      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
    >
      DM
    </button>
  );
}
