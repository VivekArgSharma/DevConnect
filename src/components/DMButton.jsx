// DMButton.jsx
import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // adapt path to your supabase client

export default function DMButton({ otherUserId }) {
  const navigate = useNavigate();

  async function handleDM() {
    // get current user session to get access token
    const session = supabase.auth.session();
    if (!session) {
      // redirect to login or show toast
      alert('Please login to send a DM.');
      return;
    }
    try {
      // call server endpoint to create / fetch chat
      const resp = await axios.post(
        `${process.env.REACT_APP_CHAT_SERVER_URL || 'http://localhost:4000'}/chat/open`,
        { other_user_id: otherUserId },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      const chatId = resp.data.chat_id;
      // navigate to chat page
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error(err);
      alert('Could not open DM. Try again.');
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
