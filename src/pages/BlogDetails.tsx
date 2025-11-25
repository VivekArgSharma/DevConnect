// src/pages/BlogDetails.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

import { upvotePost } from "@/lib/upvote";
import { fetchComments, createComment, deleteComment } from "@/lib/comments";

import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL as string;

export default function BlogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, session, user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: post,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["blog", id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/posts/${id}`);
      if (!res.ok) throw new Error("Blog not found");
      return res.json();
    },
  });

  // Fetch comments
  const {
    data: comments = [],
    isLoading: commentsLoading,
  } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => fetchComments(id!),
    enabled: !!id,
  });

  // Local state
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const createMutation = useMutation({
    mutationFn: (payload: { post_id: string; content: string; parent_id?: string | null }) =>
      createComment(payload.post_id, payload.content, accessToken!, payload.parent_id),
    onSuccess: () => {
      setNewComment("");
      setReplyText("");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
    },
  });

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>Loading blog...</p>
      </div>
    );

  if (error || !post)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>Blog not found.</p>
      </div>
    );

  const isOwner = user?.id === post.user_id;

  const handleDelete = async () => {
    if (!accessToken) return;

    const yes = confirm("Delete this blog?");
    if (!yes) return;

    const res = await fetch(`${API_URL}/api/posts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      alert("Failed to delete");
      return;
    }

    navigate("/blogs");
  };

  // Build nested tree
  const buildTree = (arr: any[]) => {
    const map = new Map();
    arr.forEach((c) => map.set(c.id, { ...c, replies: [] }));

    const roots: any[] = [];
    for (const c of map.values()) {
      if (c.parent_id) {
        const parent = map.get(c.parent_id);
        if (parent) parent.replies.push(c);
      } else roots.push(c);
    }
    return roots;
  };

  const commentTree = buildTree(comments);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <img src={post.cover_image_url} className="w-full h-72 object-cover rounded-xl shadow" />

      <h1 className="text-3xl font-bold">{post.title}</h1>

      <div className="flex items-center gap-3">
        <img src={post.profiles?.avatar_url} className="w-10 h-10 rounded-full" />
        <span>{post.profiles?.full_name}</span>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          variant="outline"
          onClick={async () => {
            await upvotePost(post.id, accessToken, API_URL);
            refetch();
          }}
        >
          ⬆ Upvote ({post.likes_count})
        </Button>

        {isOwner && (
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>

      <p className="whitespace-pre-line">{post.content}</p>

      {/* COMMENTS */}
      <hr className="my-6" />
      <h2 className="text-xl font-bold">Comments</h2>

      <div className="border p-4 rounded-lg">
        {!session ? (
          <p>
            Sign in to comment.{" "}
            <button className="underline" onClick={() => navigate("/profile")}>
              Sign in
            </button>
          </p>
        ) : (
          <>
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <Button
                onClick={() =>
                  createMutation.mutate({
                    post_id: id!,
                    content: newComment.trim(),
                  })
                }
              >
                Post Comment
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Comments */}
      <div className="space-y-3">
        {commentsLoading ? (
          <p>Loading comments...</p>
        ) : commentTree.length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          commentTree.map((c: any) => (
            <CommentItem
              key={c.id}
              comment={c}
              session={session}
              replyTo={replyTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onReply={setReplyTo}
              onAddReply={() =>
                createMutation.mutate({
                  post_id: id!,
                  content: replyText.trim(),
                  parent_id: c.id,
                })
              }
              onDelete={(cid) => deleteMutation.mutate(cid)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Recursive Comment UI
function CommentItem({
  comment,
  session,
  replyTo,
  replyText,
  setReplyText,
  onReply,
  onAddReply,
  onDelete,
}: any) {
  const author = comment.profiles?.full_name || "Unknown";
  const avatar =
    comment.profiles?.avatar_url ||
    `https://ui-avatars.com/api/?name=${author}&background=0D8ABC&color=fff`;

  return (
    <div className="border p-4 rounded-lg bg-white">
      <div className="flex gap-3">
        <img src={avatar} className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <p className="font-semibold">{author}</p>
          <p className="text-gray-700">{comment.content}</p>

          <button className="underline text-xs" onClick={() => onReply(comment.id)}>
            Reply
          </button>

          {session?.user?.id === comment.user_id && (
            <button
              className="text-red-500 underline text-xs ml-2"
              onClick={() => onDelete(comment.id)}
            >
              Delete
            </button>
          )}

          {replyTo === comment.id && (
            <div className="mt-3">
              <Textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <Button onClick={onAddReply}>Reply</Button>
              </div>
            </div>
          )}

          {comment.replies.length > 0 && (
            <div className="mt-3 pl-6 border-l space-y-2">
              {comment.replies.map((r: any) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  session={session}
                  replyTo={replyTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  onReply={onReply}
                  onAddReply={() =>
                    createComment(r.post_id, replyText.trim(), session.access_token, r.id)
                  }
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
