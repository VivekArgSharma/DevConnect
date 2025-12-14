import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function DeletePostButton({
  postId,
  ownerId,
}: {
  postId: string;
  ownerId: string;
}) {
  const { session, accessToken } = useAuth();
  const navigate = useNavigate();

  // hide button if not logged in or not owner
  if (!session || session.user.id !== ownerId) return null;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/${postId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!res.ok) {
        console.log("Delete failed");
        return;
      }

      console.log("Post deleted");
      navigate("/projects"); // or /blogs depending on your app
    } catch (err) {
      console.log("Delete error:", err);
    }
  };

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      Delete
    </Button>
  );
}
