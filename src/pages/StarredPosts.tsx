// src/pages/StarredPosts.tsx
"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { ProjectCard } from "@/components/ui/project-card";
import { fetchStarredPosts, toggleStar } from "@/lib/stars";
import { upvotePost } from "@/lib/upvote";

const API_URL = import.meta.env.VITE_API_URL;

export default function StarredPosts() {
  const { user, accessToken } = (useAuth() as any) || {};
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: posts = [],
    isLoading,
  } = useQuery({
    queryKey: ["starred-posts"],
    queryFn: () =>
      user ? fetchStarredPosts(user.id) : Promise.resolve<any[]>([]),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="p-6">
        <p>You need to be signed in to see your starred posts.</p>
      </div>
    );
  }

  const projects = posts.filter((p: any) => p.type === "project");
  const blogs = posts.filter((p: any) => p.type === "blog");

  const handleToggleStar = async (postId: string) => {
    await toggleStar(postId, user.id);
    queryClient.invalidateQueries({ queryKey: ["starred-posts"] });
    queryClient.invalidateQueries({ queryKey: ["starred-ids"] });
  };

  const handleUpvote = async (postId: string) => {
    if (!accessToken) return;
    await upvotePost(postId, accessToken, API_URL);
    // If these posts appear elsewhere, they'll refresh when user revisits
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Starred Posts</h1>
        <button
          onClick={() => navigate("/profile")}
          className="text-sm text-blue-600 underline"
        >
          ← Back to Profile
        </button>
      </div>

      {isLoading && <p>Loading starred posts…</p>}
      {!isLoading && posts.length === 0 && (
        <p>You haven&apos;t starred any projects or blogs yet.</p>
      )}

      {projects.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Starred Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((post: any) => (
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
                isStarred={true} // this page only shows starred posts
                onToggleStar={() => handleToggleStar(post.id)}
              />
            ))}
          </div>
        </section>
      )}

      {blogs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Starred Blogs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogs.map((post: any) => (
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
                isStarred={true}
                onToggleStar={() => handleToggleStar(post.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
