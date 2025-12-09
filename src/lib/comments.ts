// src/lib/comments.ts
const API_URL = import.meta.env.VITE_API_URL as string;

/**
 * Fetch comments for a post
 */
export async function fetchComments(postId: string) {
  const res = await fetch(
    `${API_URL}/comments?post_id=${encodeURIComponent(postId)}`
  );
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Failed to fetch comments");
  }
  return res.json();
}

/**
 * Create a comment (or a reply when parentId is provided)
 * - postId: id of post
 * - content: comment text
 * - accessToken: user's access token (required)
 * - parentId?: optional parent comment id for replies
 * Returns created comment (including profiles when backend returns it)
 */
export async function createComment(
  postId: string,
  content: string,
  accessToken: string,
  apiUrl: string = API_URL,
  parentId?: string
) {
  const body: any = { post_id: postId, content };
  if (parentId) body.parent_id = parentId;

  const res = await fetch(`${apiUrl}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Failed to create comment");
  }

  return res.json();
}

/**
 * Delete a comment (must be owner). Requires accessToken.
 */
export async function deleteComment(
  commentId: string,
  accessToken: string,
  apiUrl: string = API_URL
) {
  const res = await fetch(`${apiUrl}/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Failed to delete comment");
  }
  return res.json();
}
