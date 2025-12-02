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

const API_URL = import.meta.env.VITE_API_URL;

export default function Projects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const {
    data: posts = [],
    isLoading,
  } = useQuery({
    queryKey: ["projects", selectedTags],
    queryFn: async () => {
      const data = await fetchPostsByTags("project", selectedTags);
      return data || [];
    },
  });

  return (
    <div className="max-w-6xl mx-auto py-10 space-y-8 px-4">
      <h1 className="text-3xl font-bold">All Projects</h1>

      {/* TAG FILTER */}
      <div className="my-4">
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

        {posts.map((post) => (
          <ProjectCard
            key={post.id}
            image={post.cover_image_url}
            title={post.title}
            author={post.profiles?.full_name || "Unknown"}
            techStack={post.tags?.join(", ") || ""}
            description={post.short_description}
            likes_count={post.likes_count}
            onClick={() => navigate(`/projects/${post.id}`)}
            onUpvote={async () => {
              await upvotePost(post.id, accessToken, API_URL);
              queryClient.invalidateQueries({ queryKey: ["projects"] });
            }}
          />
        ))}
      </div>
    </div>
  );
}
