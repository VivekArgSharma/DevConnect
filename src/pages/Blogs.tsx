// src/pages/Blogs.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { ProjectCard } from "@/components/ui/project-card";
import { TagsFilter } from "@/components/TagsFilter";
import { fetchPostsByTags } from "@/lib/posts";
import { upvotePost } from "@/lib/upvote";
import { useAuth } from "@/contexts/AuthContext";
import { fetchStarredPostIds, toggleStar } from "@/lib/stars";
import Squares from "@/components/ui/Squares";

const API_URL = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 9;

export default function Blogs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, accessToken } = (useAuth() as any) || {};

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  /* ---------------- FETCH BLOGS ---------------- */
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["blogs", selectedTags, page],
    queryFn: () =>
      fetchPostsByTags("blog", selectedTags, page, PAGE_SIZE),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const posts = data?.data ?? [];
  const hasMore = Boolean(data?.meta?.hasMore);

  /* ---------------- STARRED POSTS ---------------- */
  const { data: starredIds = [] } = useQuery({
    queryKey: ["starred-ids"],
    queryFn: () =>
      user ? fetchStarredPostIds(user.id) : Promise.resolve<string[]>([]),
    enabled: !!user,
  });

  const handleToggleStar = async (postId: string) => {
    if (!user) return;
    await toggleStar(postId, user.id);
    queryClient.invalidateQueries({ queryKey: ["starred-ids"] });
  };

  const handleUpvote = async (postId: string) => {
    if (!accessToken) return;
    await upvotePost(postId, accessToken, API_URL);
    queryClient.invalidateQueries({ queryKey: ["blogs"] });
  };

  const handleTagChange = (tags: string[]) => {
    setSelectedTags(tags);
    setPage(1);
  };

  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <Squares
          direction="diagonal"
          speed={0.3}
          borderColor="hsl(var(--border) / 0.3)"
          squareSize={50}
          hoverFillColor="hsl(var(--primary) / 0.1)"
        />
      </div>

      <div className="relative p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold">Blogs</h1>

        <TagsFilter
          selected={selectedTags}
          onChange={handleTagChange}
          type="blog"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading && <p>Loading blogs…</p>}
        {!isLoading && posts.length === 0 && <p>No blogs found</p>}

        {posts.map((post: any) => (
          <ProjectCard
            key={post.id}
            image={post.cover_image_url}
            title={post.title}
            author={post.profiles?.full_name || "Unknown"}
            techStack={post.tags?.join(", ") || ""}
            description={post.short_description}
            likes_count={post.likes_count}
            onClick={() => navigate(`/blogs/${post.id}`)}
            onUpvote={() => handleUpvote(post.id)}
            isStarred={user ? starredIds.includes(post.id) : false}
            onToggleStar={() => handleToggleStar(post.id)}
          />
        ))}
      </div>

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
              className="px-6 py-2 border border-border rounded-md hover:bg-muted bg-card/80 backdrop-blur-sm"
            >
              {isFetching ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
