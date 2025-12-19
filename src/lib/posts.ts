// src/lib/posts.ts
import { supabase } from "./supabaseClient";

/* -----------------------------------------------------
   TAGS (UNCHANGED)
----------------------------------------------------- */

export async function fetchAllTags(type: "project" | "blog") {
  const viewName =
    type === "project"
      ? "project_tags_aggregate"
      : "blog_tags_aggregate";

  const { data, error } = await supabase
    .from(viewName)
    .select("*")
    .order("tag_count", { ascending: false });

  if (error) throw error;
  return data;
}

/* -----------------------------------------------------
   FETCH POSTS (PUBLIC → APPROVED ONLY) [OPTIMIZED]
----------------------------------------------------- */

type FetchPostsResult = {
  data: any[];
  meta: {
    page: number;
    limit: number;
    total: number | null;
    hasMore: boolean;
  };
};

export async function fetchPostsByTags(
  p_type: "project" | "blog",
  selectedTags: string[] = [],
  page: number = 1,
  limit: number = 9
): Promise<FetchPostsResult> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("posts")
    .select(
      `
      id,
      type,
      title,
      short_description,
      cover_image_url,
      tags,
      likes_count,
      created_at,
      profiles(full_name)
      `,
      { count: "exact" }
    )
    .eq("type", p_type)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (selectedTags.length > 0) {
    query = query.contains("tags", selectedTags);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    data: data ?? [],
    meta: {
      page,
      limit,
      total: count,
      hasMore: from + (data?.length ?? 0) < (count ?? 0),
    },
  };
}
