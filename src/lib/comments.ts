// src/lib/comments.ts
const API_URL = import.meta.env.VITE_API_URL as string;

/**
 * Fetch comments for a post
 */
export async function fetchComments(postId: string) {
  const res = await fetch(`${API_URL}/api/comments?post_id=${encodeURIComponent(postId)}`);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Failed to fetch comments');
  }
  return res.json();
}

/**
 * Create a comment (or reply)
 * - accessToken must be provided (signed in)
 */
export async function createComment(postId: string, content: string, accessToken: string, parentId?: string | null) {
  const res = await fetch(`${API_URL}/api/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      post_id: postId,
      content,
      parent_id: parentId ?? null,
    }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Failed to create comment');
  }
  return res.json();
}

/**
 * Delete comment
 */
export async function deleteComment(commentId: string, accessToken: string) {
  const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Failed to delete comment');
  }
  return res.json();
}
