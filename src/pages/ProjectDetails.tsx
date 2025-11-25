// src/pages/ProjectDetails.tsx
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
  const { accessToken, session, user } = useAuth();
  const queryClient = useQueryClient();

  // ---------- FETCH PROJECT ----------
  const {
    data: post,
    isPending: postLoading,
    error: postError,
    refetch,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/posts/${id}`);
      if (!res.ok) throw new Error("Project not found");
      return res.json();
    },
    enabled: !!id,
  });

  // ---------- FETCH COMMENTS ----------
  const {
    data: comments = [],
    isPending: commentsLoading,
  } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => fetchComments(id!),
    enabled: !!id,
  });

  // ---------- LOCAL STATE ----------
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // ---------- CREATE COMMENT ----------
  const createMutation = useMutation({
    mutationFn: (payload: {
      post_id: string;
      content: string;
      parent_id?: string | null;
    }) =>
      createComment(
        payload.post_id,
        payload.content,
        accessToken!,
        payload.parent_id
      ),

    onSuccess: () => {
      setNewComment("");
      setReplyText("");
      setReplyTo(null);

      queryClient.invalidateQueries({ queryKey: ["comments", id] });
    },
  });

  // ---------- DELETE COMMENT ----------
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) =>
      deleteComment(commentId, accessToken!),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
    },
  });

  // ---------- DELETE POST ----------
  const handleDelete = async () => {
    if (!accessToken) return;

    const yes = confirm("Delete this project?");
    if (!yes) return;

    const res = await fetch(`${API_URL}/api/posts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) navigate("/projects");
  };

  if (postLoading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        Loading…
      </div>
    );

  if (postError || !post)
    return (
      <div className="min-h-screen flex justify-center items-center">
        Project not found.
      </div>
    );

  const isOwner = user?.id === post.user_id;

  // ---------- BUILD COMMENT TREE ----------
  const buildTree = (arr: any[]) => {
    const map = new Map();
    arr.forEach((c) => map.set(c.id, { ...c, replies: [] }));

    const roots: any[] = [];
    for (const c of map.values()) {
      if (c.parent_id) {
        const parent = map.get(c.parent_id);
        if (parent) parent.replies.push(c);
      } else {
        roots.push(c);
      }
    }
    return roots;
  };

  const commentTree = buildTree(comments);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      {/* COVER IMAGE */}
      <img
        src={post.cover_image_url}
        alt={post.title}
        className="w-full h-72 object-cover rounded-xl shadow"
      />

      {/* TITLE */}
      <h1 className="text-3xl font-bold">{post.title}</h1>

      {/* AUTHOR */}
      <div className="flex items-center gap-3 text-gray-600">
        <img
          src={post.profiles?.avatar_url}
          className="w-10 h-10 rounded-full border"
        />
        <span>{post.profiles?.full_name}</span>
      </div>

      {/* UPVOTE + DELETE */}
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

      {/* CONTENT */}
      <p className="text-gray-700 whitespace-pre-line">{post.content}</p>

      {/* LINKS */}
      {post.project_link && (
        <a
          href={post.project_link}
          target="_blank"
          className="text-blue-600 underline block mt-4"
        >
          Project Link
        </a>
      )}

      {post.github_link && (
        <a
          href={post.github_link}
          target="_blank"
          className="text-blue-600 underline block"
        >
          GitHub Repository
        </a>
      )}

      {/* COMMENTS SECTION */}
      <hr className="my-6" />
      <h2 className="text-xl font-bold">Comments</h2>

      {/* ADD COMMENT */}
      <div className="border p-4 rounded-lg">
        {!session ? (
          <p>
            You must{" "}
            <span
              className="underline cursor-pointer"
              onClick={() => navigate("/profile")}
            >
              sign in
            </span>{" "}
            to comment.
          </p>
        ) : (
          <>
            <Textarea
              rows={3}
              value={newComment}
              placeholder="Write a comment..."
              onChange={(e) => setNewComment(e.target.value)}
            />

            <div className="flex justify-end mt-2">
              <Button
                disabled={createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    post_id: id!,
                    content: newComment.trim(),
                  })
                }
              >
                {createMutation.isPending ? "Posting…" : "Post Comment"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* COMMENT LIST */}
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

// ------------------------------------------------------
//  COMMENT COMPONENT (recursive)
// ------------------------------------------------------
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
          <p className="text-gray-700 whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Reply / Delete */}
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

          {/* Reply box */}
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

          {/* Replies */}
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
                  onAddReply={onAddReply}
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
