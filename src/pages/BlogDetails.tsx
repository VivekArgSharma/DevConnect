// src/pages/BlogDetails.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

import { upvotePost } from "@/lib/upvote";
import { fetchComments, createComment, deleteComment } from "@/lib/comments";

import { useMemo, useState } from "react";

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
      const res = await fetch(`${API_URL}/api/posts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    },
    enabled: !!id,
  });

  // comments
  const { data: commentsRaw = [], refetch: refetchComments, isFetching: commentsLoading } = useQuery({
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
    mutationFn: async ({ post_id, content, parent_id }: { post_id: string; content: string; parent_id?: string }) => {
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

  // build tree (roots with children arrays)
  const commentTree = useMemo(() => buildCommentTree(commentsRaw || []), [commentsRaw]);

  if (!post) return <div>Loading post...</div>;

  const goToUser = (uid?: string) => {
    if (!uid) return;
    if (uid === user?.id) navigate("/profile");
    else navigate(`/user/${uid}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold">{post.title}</h1>

      <div className="flex items-center gap-3 mt-4">
        <img
          src={(post.profiles && post.profiles.avatar_url) || post.avatar_url || "/default-avatar.png"}
          className="w-10 h-10 rounded-full cursor-pointer"
          onClick={() => goToUser(post.user_id)}
        />
        <span className="cursor-pointer text-blue-600" onClick={() => goToUser(post.user_id)}>
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
        <p className="whitespace-pre-line">{post.content}</p>

        <hr className="my-6" />
        <h2 className="text-xl font-bold">Comments</h2>

        {/* Add top-level comment */}
        <div className="border p-4 rounded-lg my-4">
          {!user ? (
            <p>You must log in to comment.</p>
          ) : (
            <>
              <Textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write a comment..."
              />
              <div className="mt-2">
                <Button onClick={() => createTop.mutate({ post_id: post.id, content: newCommentText })}>
                  Post
                </Button>
              </div>
            </>
          )}
        </div>

        {commentsLoading ? (
          <p>Loading comments...</p>
        ) : commentTree.length === 0 ? (
          <p className="text-gray-500">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {commentTree.map((c) => (
              <CommentNode
                key={c.id}
                node={c}
                depth={0}
                goToUser={goToUser}
                currentUserId={user?.id}
                onReplySubmit={(parentId, text) => createReply.mutate({ post_id: post.id, content: text, parent_id: parentId })}
                onDelete={(cid) => delMut.mutate(cid)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------
   Helpers: build tree
   --------------------------- */
function buildCommentTree(flat: any[]) {
  const map = new Map<string, any>();
  for (const r of flat) {
    map.set(r.id, { ...r, children: [] });
  }
  const roots: any[] = [];
  // keep original order so replies appear in chronological order under their parents
  for (const r of flat) {
    const node = map.get(r.id);
    if (!node) continue;
    if (node.parent_id) {
      const parent = map.get(node.parent_id);
      if (parent) parent.children.push(node);
      else roots.push(node); // orphan reply -> treat as root
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/* ---------------------------
   CommentNode - recursive
   Visual rules:
   - parent comment: card with border
   - replies: lighter background, smaller padding, slightly indented (margin-left)
   - replies nested inside parent element (no separate big card list)
   --------------------------- */
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
  const avatar = node.profiles?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}`;

  const isRoot = depth === 0;

  return (
    <div>
      {/* Parent or root comment card */}
      <div className={`p-3 rounded ${isRoot ? "bg-white border" : "bg-gray-50"}`} style={{ marginLeft: depth * 18 }}>
        <div className="flex gap-3">
          <img
            src={avatar}
            className="w-10 h-10 rounded-full cursor-pointer"
            onClick={() => goToUser(node.user_id)}
          />

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold cursor-pointer text-blue-600" onClick={() => goToUser(node.user_id)}>
                  {author}
                </p>
                <p className="text-xs text-gray-500">{new Date(node.created_at).toLocaleString()}</p>
              </div>

              {currentUserId === node.user_id && (
                <button className="text-red-500 text-xs underline" onClick={() => onDelete(node.id)}>
                  Delete
                </button>
              )}
            </div>

            <p className="mt-2 whitespace-pre-wrap">{node.content}</p>

            <div className="mt-2 flex items-center gap-3">
              <button className="text-sm text-gray-600 underline" onClick={() => setShowReply((s) => !s)}>
                Reply
              </button>
            </div>

            {showReply && (
              <div className="mt-2">
                <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." />
                <div className="mt-2 flex gap-2">
                  <Button
                    onClick={() => {
                      if (!replyText.trim()) return;
                      onReplySubmit(node.id, replyText.trim());
                      setReplyText("");
                      setShowReply(false);
                    }}
                  >
                    Reply
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowReply(false); setReplyText(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children: render directly below parent, indented slightly more */}
      {node.children && node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child: any) => (
            <CommentNode
              key={child.id}
              node={child}
              depth={depth + 1}
              goToUser={goToUser}
              currentUserId={currentUserId}
              onReplySubmit={onReplySubmit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
