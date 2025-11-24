export async function upvotePost(postId: string, accessToken: string | null, API_URL: string) {
  const res = await fetch(`${API_URL}/api/posts/${postId}/upvote`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to upvote");
  }

  return res.json();
}
