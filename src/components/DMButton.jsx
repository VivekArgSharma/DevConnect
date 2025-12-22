// src/components/DMButton.jsx
import { useNavigate } from "react-router-dom";

export default function DMButton({ otherUserId }) {
  const navigate = useNavigate();

  function handleDM() {
    if (!otherUserId) return;
    navigate(`/chat/${otherUserId}`);
  }

  return (
    <button
      onClick={handleDM}
      className="px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
    >
      DM
    </button>
  );
}
