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

  const { data: post } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/posts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
    enabled: !!id,
  });

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

  return (
    <>
      <div className="fixed inset-0 -z-10">
        <Squares direction="diagonal" speed={0.3} squareSize={50} />
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold">{post.title}</h1>

        {/* Short Description */}
        {post.short_description && (
          <p className="mt-2 text-muted-foreground">
            {post.short_description}
          </p>
        )}

        {/* Links */}
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

        {/* Screenshots */}
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

        {/* Content */}
        <div className="mt-6 whitespace-pre-line">{post.content}</div>

        {/* Comments */}
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

/* helpers */
function buildCommentTree(flat: any[]) {
  const map = new Map();
  flat.forEach((c: any) => map.set(c.id, { ...c, children: [] }));
  const roots: any[] = [];
  flat.forEach((c: any) => {
    const node = map.get(c.id);
    if (node.parent_id && map.get(node.parent_id)) {
      map.get(node.parent_id).children.push(node);
    } else roots.push(node);
  });
  return roots;
}

function CommentNode({ node, depth, currentUserId, onReplySubmit, onDelete }: any) {
  return (
    <div style={{ marginLeft: depth * 16 }} className="mt-3">
      <p className="font-semibold">{node.content}</p>
      {currentUserId === node.user_id && (
        <button onClick={() => onDelete(node.id)}>Delete</button>
      )}
      {node.children.map((c: any) => (
        <CommentNode
          key={c.id}
          node={c}
          depth={depth + 1}
          currentUserId={currentUserId}
          onReplySubmit={onReplySubmit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
