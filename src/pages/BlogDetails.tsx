// src/pages/BlogDetails.tsx
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

export default function BlogDetails() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  const [newCommentText, setNewCommentText] = useState("");

  // post
  const { data: post } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/posts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    },
    enabled: !!id,
  });

  // comments
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
    mutationFn: async ({
      post_id,
      content,
      parent_id,
    }: {
      post_id: string;
      content: string;
      parent_id?: string;
    }) => {
      if (!accessToken) throw new Error("Not authenticated");
      return createComment(post_id, content, accessToken, API_URL, parent_id);
    },
    onSuccess: () => {
      refetchComments();
    },
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

  if (!post) return <div className="text-foreground p-6">Loading post...</div>;

  const goToUser = (uid?: string) => {
    if (!uid) return;
    if (uid === user?.id) navigate("/profile");
    else navigate(`/user/${uid}`);
  };

  return (
    <>
      <div className="fixed inset-0 -z-10">
        <Squares
          direction="diagonal"
          speed={0.3}
          borderColor="hsl(var(--border) / 0.3)"
          squareSize={50}
          hoverFillColor="hsl(var(--primary) / 0.1)"
        />
      </div>
      <div className="max-w-4xl mx-auto p-6 relative">
      <h1 className="text-3xl font-bold text-foreground">{post.title}</h1>

      {/* Tags */}
      <div className="mt-2 flex gap-2 flex-wrap">
        {(post.tags || []).map((t: string) => (
          <span key={t} className="px-3 py-1 rounded-full border border-border bg-secondary text-foreground text-sm">
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <img
          src={
            post.profiles?.avatar_url ||
            post.avatar_url ||
            "/default-avatar.png"
          }
          className="w-10 h-10 rounded-full cursor-pointer"
          onClick={() => goToUser(post.user_id)}
        />
        <span
          className="cursor-pointer text-primary hover:underline"
          onClick={() => goToUser(post.user_id)}
        >
          {post.profiles?.full_name ?? post.full_name ?? "Unknown"}
        </span>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          variant="outline"
          onClick={async () => {
            await upvotePost(post.id, accessToken, API_URL);
          }}
        >
          Upvote
        </Button>
      </div>

      <div className="mt-6">
        <p className="whitespace-pre-line text-foreground">{post.content}</p>

        <hr className="my-6 border-border" />
        <h2 className="text-xl font-bold text-foreground">Comments</h2>

        <div className="border border-border bg-card p-4 rounded-lg my-4">
          {!user ? (
            <p className="text-muted-foreground">You must log in to comment.</p>
          ) : (
            <>
              <Textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write a comment..."
              />
              <div className="mt-2">
                <Button
                  onClick={() =>
                    createTop.mutate({
                      post_id: post.id,
                      content: newCommentText,
                    })
                  }
                >
                  Post
                </Button>
              </div>
            </>
          )}
        </div>

        {commentsLoading ? (
          <p className="text-muted-foreground">Loading comments...</p>
        ) : commentTree.length === 0 ? (
          <p className="text-muted-foreground">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {commentTree.map((c) => (
              <CommentNode
                key={c.id}
                node={c}
                depth={0}
                goToUser={goToUser}
                currentUserId={user?.id}
                onReplySubmit={(parentId, text) =>
                  createReply.mutate({
                    post_id: post.id,
                    content: text,
                    parent_id: parentId,
                  })
                }
                onDelete={(cid) => delMut.mutate(cid)}
              />
            ))}
          </div>
        )}

        <div className="mt-10 pb-10">
          <DeletePostButton postId={post.id} ownerId={post.user_id} />
        </div>
      </div>

        {/* 🤖 AI CHATBOT */}
        <AIPostChatbot
          context={`
BLOG POST

Title: ${post.title}

Author: ${post.profiles?.full_name ?? post.full_name ?? "Unknown"}

Tags: ${(post.tags || []).join(", ")}

Content:
${post.content}
`}
        />
      </div>
    </>
  );
}

/* helpers */
function buildCommentTree(flat: any[]) {
  const map = new Map<string, any>();
  for (const r of flat) map.set(r.id, { ...r, children: [] });
  const roots: any[] = [];
  for (const r of flat) {
    const node = map.get(r.id);
    if (!node) continue;
    if (node.parent_id) {
      const parent = map.get(node.parent_id);
      parent ? parent.children.push(node) : roots.push(node);
    } else roots.push(node);
  }
  return roots;
}

/* CommentNode updated with theme tokens */
function CommentNode({ node, depth, goToUser, currentUserId, onReplySubmit, onDelete }: any) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const author = node.profiles?.full_name ?? node.full_name ?? "Unknown";
  const avatar =
    node.profiles?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}`;

  return (
    <div>
      <div className={`p-3 rounded ${depth === 0 ? "bg-card border border-border" : "bg-secondary"}`} style={{ marginLeft: depth * 18 }}>
        <div className="flex gap-3">
          <img src={avatar} className="w-10 h-10 rounded-full cursor-pointer" onClick={() => goToUser(node.user_id)} />
          <div className="flex-1">
            <p className="font-semibold cursor-pointer text-primary hover:underline" onClick={() => goToUser(node.user_id)}>
              {author}
            </p>
            <p className="text-xs text-muted-foreground">{new Date(node.created_at).toLocaleString()}</p>
            <p className="mt-2 whitespace-pre-wrap text-foreground">{node.content}</p>

            <div className="mt-2 flex gap-3">
              <button className="text-sm underline text-primary" onClick={() => setShowReply(!showReply)}>
                Reply
              </button>
              {currentUserId === node.user_id && (
                <button className="text-sm text-destructive underline" onClick={() => onDelete(node.id)}>
                  Delete
                </button>
              )}
            </div>

            {showReply && (
              <div className="mt-2">
                <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                <Button
                  className="mt-2"
                  onClick={() => {
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

      {node.children?.map((c: any) => (
        <CommentNode key={c.id} node={c} depth={depth + 1} goToUser={goToUser} currentUserId={currentUserId} onReplySubmit={onReplySubmit} onDelete={onDelete} />
      ))}
    </div>
  );
}
