// src/pages/Projects.tsx
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

const API_URL = import.meta.env.VITE_API_URL;

export default function Projects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, accessToken } = (useAuth() as any) || {};

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Fetch projects
  const {
    data: posts = [],
    isLoading,
  } = useQuery({
    queryKey: ["projects", selectedTags],
    queryFn: () => fetchPostsByTags("project", selectedTags),
  });

  // Fetch starred IDs for current user
  const { data: starredIds = [] } = useQuery({
    queryKey: ["starred-ids"],
    queryFn: () =>
      user ? fetchStarredPostIds(user.id) : Promise.resolve<string[]>([]),
    enabled: !!user,
  });

  const handleToggleStar = async (postId: string) => {
    if (!user) return;
    await toggleStar(postId, user.id);
    // Refresh star info across pages
    queryClient.invalidateQueries({ queryKey: ["starred-ids"] });
  };

  const handleUpvote = async (postId: string) => {
    if (!accessToken) return;
    await upvotePost(postId, accessToken, API_URL);
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Projects</h1>

        <TagsFilter
          selected={selectedTags}
          onChange={setSelectedTags}
          type="project"
        />
      </div>

      {/* PROJECT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading && <p>Loading projects…</p>}
        {!isLoading && posts.length === 0 && <p>No projects found</p>}

        {posts.map((post: any) => (
          <ProjectCard
            key={post.id}
            image={post.cover_image_url}
            title={post.title}
            author={post.profiles?.full_name || "Unknown"}
            techStack={post.tags?.join(", ") || ""}
            description={post.short_description}
            likes_count={post.likes_count}
            onClick={() => navigate(`/projects/${post.id}`)}
            onUpvote={() => handleUpvote(post.id)}
            isStarred={user ? starredIds.includes(post.id) : false}
            onToggleStar={() => handleToggleStar(post.id)}
          />
        ))}
      </div>
    </div>
  );
}
