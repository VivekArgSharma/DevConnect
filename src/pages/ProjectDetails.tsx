import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

import { upvotePost } from "@/lib/upvote";
import { fetchComments, createComment, deleteComment } from "@/lib/comments";

import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL as string;

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: session, accessToken } = useAuth();
  const [commentText, setCommentText] = useState("");

  const { data: post } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/posts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: comments = [], refetch } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => fetchComments(id!),
    enabled: !!id,
  });

  const addComment = useMutation({
    mutationFn: async (payload: { post_id: string; content: string }) => {
      return createComment(payload.post_id, payload.content, accessToken, API_URL);
    },
    onSuccess: () => {
      setCommentText("");
      refetch();
    },
  });

  const delComment = useMutation({
    mutationFn: async (commentId: string) => deleteComment(commentId, accessToken),
    onSuccess: () => refetch(),
  });

  if (!post) return <div>Loading...</div>;

  const goToUser = (uid: string) => {
    if (uid === session?.id) navigate("/profile");
    else navigate(`/user/${uid}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">

      <h1 className="text-3xl font-bold">{post.title}</h1>

      <div className="flex items-center gap-3 mt-3">
        <img
          src={post.profiles?.avatar_url || "/default-avatar.png"}
          className="w-10 h-10 rounded-full cursor-pointer"
          onClick={() => goToUser(post.user_id)}
        />
        <span
          className="cursor-pointer text-blue-600"
          onClick={() => goToUser(post.user_id)}
        >
          {post.profiles?.full_name}
        </span>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          variant="outline"
          onClick={async () => {
            await upvotePost(post.id, accessToken, API_URL);
            queryClient.invalidateQueries({ queryKey: ["project", id] });
          }}
        >
          Upvote
        </Button>
      </div>

      <div className="mt-6">
        <p className="whitespace-pre-line">{post.content}</p>

        <hr className="my-6" />
        <h2 className="text-xl font-bold">Comments</h2>

        <div className="border p-4 rounded-lg my-4">
          {!session ? (
            <p>You must log in to comment.</p>
          ) : (
            <>
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
              />
              <Button
                className="mt-2"
                onClick={() => addComment.mutate({ post_id: post.id, content: commentText })}
              >
                Comment
              </Button>
            </>
          )}
        </div>

        {comments.map((comment: any) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            session={session}
            onDelete={() => delComment.mutate(comment.id)}
            goToUser={goToUser}
          />
        ))}
      </div>
    </div>
  );
}

function CommentItem({ comment, session, onDelete, goToUser }: any) {
  const author = comment.profiles?.full_name || "Unknown";
  const avatar =
    comment.profiles?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}`;

  return (
    <div className="border p-4 rounded-lg my-2">
      <div className="flex gap-3">
        <img
          src={avatar}
          className="w-10 h-10 rounded-full cursor-pointer"
          onClick={() => goToUser(comment.user_id)}
        />

        <div className="flex-1">
          <p
            className="font-semibold cursor-pointer text-blue-600"
            onClick={() => goToUser(comment.user_id)}
          >
            {author}
          </p>

          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>

          {session?.id === comment.user_id && (
            <button className="text-red-500 text-xs underline" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
