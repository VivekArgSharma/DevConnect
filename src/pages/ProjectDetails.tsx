// src/pages/ProjectDetails.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

import { upvotePost } from "@/lib/upvote";
import { fetchComments, createComment, deleteComment } from "@/lib/comments";

import { useMemo, useState } from "react";
import DeletePostButton from "@/components/DeletePostButton";
import AIPostChatbot from "@/components/AIPostChatbot";
import Squares from "@/components/ui/Squares";

const API_URL = import.meta.env.VITE_API_URL as string;

export default function ProjectDetails() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  const [newCommentText, setNewCommentText] = useState("");

  /* ---------------- PROJECT ---------------- */
  const { data: post } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/posts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
    enabled: !!id,
  });

  /* ---------------- COMMENTS ---------------- */
  const {
    data: commentsRaw = [],
    refetch: refetchComments,
    isFetching: commentsLoading,
  } = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => fetchComments(id!),
    enabled: !!id,
  });

  const createTop = useMutation({
    mutationFn: async ({ post_id, content }: { post_id: string; content: string }) => {
      if (!accessToken) throw new Error("Not authenticated");
      return createComment(post_id, content, accessToken, API_URL);
    },
    onSuccess: () => {
      setNewCommentText("");
      refetchComments();
    },
  });

  const createReply = useMutation({
    mutationFn: async ({ post_id, content, parent_id }: any) => {
      if (!accessToken) throw new Error("Not authenticated");
      return createComment(post_id, content, accessToken, API_URL, parent_id);
    },
    onSuccess: () => refetchComments(),
  });

  const delMut = useMutation({
    mutationFn: async (commentId: string) => {
      if (!accessToken) throw new Error("Not authenticated");
      return deleteComment(commentId, accessToken, API_URL);
    },
    onSuccess: () => refetchComments(),
  });

  const commentTree = useMemo(
    () => buildCommentTree(commentsRaw || []),
    [commentsRaw]
  );

  if (!post) return <div className="p-6">Loading...</div>;

  /* ---------------- AUTHOR NAV ---------------- */
  const goToUser = (uid?: string) => {
    if (!uid) return;
    if (uid === user?.id) navigate("/profile");
    else navigate(`/user/${uid}`);
  };

  return (
    <>
      <div className="fixed inset-0 -z-10">
        <Squares direction="diagonal" speed={0.3} squareSize={50} />
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* TITLE */}
        <h1 className="text-3xl font-bold">{post.title}</h1>

        {/* AUTHOR (✅ ADDED — SAME AS BLOG DETAILS) */}
        <div className="flex items-center gap-3 mt-3">
          <img
            src={
              post.profiles?.avatar_url ||
              post.avatar_url ||
              "/default-avatar.png"
            }
            className="w-10 h-10 rounded-full cursor-pointer border"
            onClick={() => goToUser(post.user_id)}
          />
          <span
            className="cursor-pointer text-primary hover:underline"
            onClick={() => goToUser(post.user_id)}
          >
            {post.profiles?.full_name ?? post.full_name ?? "Unknown"}
          </span>
        </div>

        {/* SHORT DESCRIPTION */}
        {post.short_description && (
          <p className="mt-4 text-muted-foreground">
            {post.short_description}
          </p>
        )}

        {/* LINKS */}
        <div className="flex gap-4 mt-4 flex-wrap">
          {post.project_link && (
            <a href={post.project_link} target="_blank" rel="noreferrer">
              <Button>Live Project</Button>
            </a>
          )}

          {post.github_link && (
            <a href={post.github_link} target="_blank" rel="noreferrer">
              <Button variant="outline">GitHub Repo</Button>
            </a>
          )}
        </div>

        {/* IMAGES */}
        {Array.isArray(post.images) && post.images.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            {post.images.map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                className="rounded-lg border"
                alt={`Screenshot ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* CONTENT */}
        <div className="mt-6 whitespace-pre-line">{post.content}</div>

        {/* COMMENTS */}
        <hr className="my-6" />
        <h2 className="text-xl font-bold">Comments</h2>

        <div className="border p-4 rounded my-4">
          {!user ? (
            <p>You must log in to comment.</p>
          ) : (
            <>
              <Textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
              />
              <Button
                className="mt-2"
                onClick={() =>
                  createTop.mutate({
                    post_id: post.id,
                    content: newCommentText,
                  })
                }
              >
                Post
              </Button>
            </>
          )}
        </div>

        {commentTree.map((c) => (
          <CommentNode
            key={c.id}
            node={c}
            depth={0}
            currentUserId={user?.id}
            goToUser={goToUser}
            onReplySubmit={(pid, text) =>
              createReply.mutate({ post_id: post.id, content: text, parent_id: pid })
            }
            onDelete={(cid) => delMut.mutate(cid)}
          />
        ))}

        <DeletePostButton postId={post.id} ownerId={post.user_id} />

        <AIPostChatbot context={post.content} />
      </div>
    </>
  );
}

/* ---------------- HELPERS ---------------- */
function buildCommentTree(flat: any[]) {
  const map = new Map<string, any>();

  // 1️⃣ Create nodes (preserve existing children if optimistic)
  for (const r of flat) {
    map.set(r.id, {
      ...r,
      children: r.children ?? [],
    });
  }

  const roots: any[] = [];

  // 2️⃣ Build tree
  for (const r of flat) {
    const node = map.get(r.id);
    if (!node) continue;

    if (node.parent_id) {
      const parent = map.get(node.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // parent not found yet → treat as root (safe fallback)
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/* ---------------- COMMENT NODE ---------------- */
function CommentNode({
  node,
  depth,
  goToUser,
  currentUserId,
  onReplySubmit,
  onDelete,
}: any) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const author = node.profiles?.full_name ?? node.full_name ?? "Unknown";
  const avatar =
    node.profiles?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}`;

  const isOptimistic = node.id?.startsWith("temp-");

  return (
    <div>
      <div
        className={`p-3 rounded ${
          depth === 0
            ? "bg-card border border-border"
            : "bg-secondary"
        } ${isOptimistic ? "opacity-80" : ""}`}
        style={{ marginLeft: depth * 18 }}
      >
        <div className="flex gap-3">
          <img
            src={avatar}
            className="w-10 h-10 rounded-full cursor-pointer"
            onClick={() => goToUser(node.user_id)}
          />

          <div className="flex-1">
            <p
              className="font-semibold cursor-pointer text-primary hover:underline"
              onClick={() => goToUser(node.user_id)}
            >
              {author}
              {isOptimistic && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (sending…)
                </span>
              )}
            </p>

            <p className="text-xs text-muted-foreground">
              {new Date(node.created_at).toLocaleString()}
            </p>

            <p className="mt-2 whitespace-pre-wrap text-foreground">
              {node.content}
            </p>

            <div className="mt-2 flex gap-3">
              <button
                className="text-sm underline text-primary"
                onClick={() => setShowReply(!showReply)}
              >
                Reply
              </button>

              {currentUserId === node.user_id && (
                <button
                  className="text-sm text-destructive underline"
                  onClick={() => onDelete(node.id)}
                >
                  Delete
                </button>
              )}
            </div>

            {showReply && (
              <div className="mt-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <Button
                  className="mt-2"
                  onClick={() => {
                    if (!replyText.trim()) return;
                    onReplySubmit(node.id, replyText);
                    setReplyText("");
                    setShowReply(false);
                  }}
                >
                  Reply
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHILDREN */}
      {node.children?.map((c: any) => (
        <CommentNode
          key={c.id}
          node={c}
          depth={depth + 1}
          goToUser={goToUser}
          currentUserId={currentUserId}
          onReplySubmit={onReplySubmit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
