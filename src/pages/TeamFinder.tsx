// src/pages/TeamFinder.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagInput from "@/components/TagInput";
// If your DMButton path is different, adjust:
import DMButton from "@/components/DMButton"; 

const API_URL =
  import.meta.env.VITE_API_URL?.endsWith("/api")
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/api";

type TeamPost = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  current_members: number | null;
  requirements: string | null;
  hackathon_link: string | null;
  github_link: string | null;
  status: "open" | "closed";
  created_at: string;
};

type ApplicationProject = {
  link: string;
  description: string;
};

type ReceivedApplication = {
  id: string;
  team_post_id: string;
  applicant_id: string;
  name: string;
  skills: string[];
  projects: ApplicationProject[];
  motivation: string | null;
  status: string;
  created_at: string;
  team_posts: {
    id: string;
    title: string;
    status: "open" | "closed";
    // user_id is not strictly needed on frontend here
  };
};

type SentApplication = ReceivedApplication; // same shape from backend

type ActiveTab = "find" | "for-team" | "your-apps";

export default function TeamFinder() {
  const { user, accessToken } = useAuth() as any;

  const [activeTab, setActiveTab] = useState<ActiveTab>("find");

  const [teamPosts, setTeamPosts] = useState<TeamPost[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<ReceivedApplication[]>([]);
  const [sentApplications, setSentApplications] = useState<SentApplication[]>([]);

  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingReceived, setLoadingReceived] = useState(false);
  const [loadingSent, setLoadingSent] = useState(false);

  const [showCreatePostForm, setShowCreatePostForm] = useState(false);
  const [createPostLoading, setCreatePostLoading] = useState(false);

  const [newPost, setNewPost] = useState({
    title: "",
    description: "",
    image_url: "",
    current_members: "",
    requirements: "",
    hackathon_link: "",
    github_link: "",
  });

  const [applyForPost, setApplyForPost] = useState<TeamPost | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyName, setApplyName] = useState("");
  const [applySkills, setApplySkills] = useState<string[]>([]);
  const [applyProjects, setApplyProjects] = useState<ApplicationProject[]>([
    { link: "", description: "" },
  ]);
  const [applyMotivation, setApplyMotivation] = useState("");

  const [selectedReceivedApp, setSelectedReceivedApp] = useState<ReceivedApplication | null>(null);
  const [editingApplication, setEditingApplication] = useState<SentApplication | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editProjects, setEditProjects] = useState<ApplicationProject[]>([]);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editName, setEditName] = useState("");
  const [editMotivation, setEditMotivation] = useState("");

  /* ------------------- FETCHERS ------------------- */

  async function fetchTeamPosts() {
    try {
      setLoadingPosts(true);
      const res = await axios.get<TeamPost[]>(`${API_URL}/teams/posts`);
      setTeamPosts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch team posts", err);
    } finally {
      setLoadingPosts(false);
    }
  }

  async function fetchReceivedApplications() {
    if (!accessToken) return;
    try {
      setLoadingReceived(true);
      const res = await axios.get<ReceivedApplication[]>(
        `${API_URL}/teams/applications/received`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setReceivedApplications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch received applications", err);
    } finally {
      setLoadingReceived(false);
    }
  }

  async function fetchSentApplications() {
    if (!accessToken) return;
    try {
      setLoadingSent(true);
      const res = await axios.get<SentApplication[]>(
        `${API_URL}/teams/applications/sent`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setSentApplications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch sent applications", err);
    } finally {
      setLoadingSent(false);
    }
  }

  useEffect(() => {
    fetchTeamPosts();
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    if (activeTab === "for-team") {
      fetchReceivedApplications();
    } else if (activeTab === "your-apps") {
      fetchSentApplications();
    }
  }, [activeTab, accessToken]);

  /* ------------------- CREATE TEAM POST ------------------- */

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) {
      alert("Please login to create a team post.");
      return;
    }

    if (!newPost.title.trim()) {
      alert("Title is required");
      return;
    }

    setCreatePostLoading(true);
    try {
      const body = {
        title: newPost.title.trim(),
        description: newPost.description.trim() || null,
        image_url: newPost.image_url.trim() || null,
        current_members: newPost.current_members
          ? Number(newPost.current_members)
          : null,
        requirements: newPost.requirements.trim() || null,
        hackathon_link: newPost.hackathon_link.trim() || null,
        github_link: newPost.github_link.trim() || null,
      };

      await axios.post(`${API_URL}/teams/posts`, body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setNewPost({
        title: "",
        description: "",
        image_url: "",
        current_members: "",
        requirements: "",
        hackathon_link: "",
        github_link: "",
      });
      setShowCreatePostForm(false);
      fetchTeamPosts();
    } catch (err) {
      console.error("Failed to create team post", err);
      alert("Failed to create post. Check console for details.");
    } finally {
      setCreatePostLoading(false);
    }
  }

  async function handleClosePost(post: TeamPost) {
    if (!accessToken) return;
    if (!confirm("Close applications for this post? This cannot be undone.")) return;

    try {
      await axios.post(
        `${API_URL}/teams/posts/${post.id}/close`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      fetchTeamPosts();
      fetchSentApplications();
      fetchReceivedApplications();
    } catch (err) {
      console.error("Failed to close post", err);
      alert("Failed to close applications.");
    }
  }

  /* ------------------- APPLY TO POST ------------------- */

  function startApply(post: TeamPost) {
    if (!accessToken) {
      alert("Please login to apply.");
      return;
    }
    setApplyForPost(post);
    setApplyName("");
    setApplySkills([]);
    setApplyProjects([{ link: "", description: "" }]);
    setApplyMotivation("");
  }

  function addApplyProject() {
    setApplyProjects((prev) => [...prev, { link: "", description: "" }]);
  }

  function updateApplyProject(idx: number, field: "link" | "description", value: string) {
    setApplyProjects((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  }

  async function handleApplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!applyForPost || !accessToken) return;

    if (!applyName.trim()) {
      alert("Please enter your name.");
      return;
    }

    setApplyLoading(true);
    try {
      await axios.post(
        `${API_URL}/teams/posts/${applyForPost.id}/apply`,
        {
          name: applyName.trim(),
          skills: applySkills,
          projects: applyProjects.filter((p) => p.link.trim()),
          motivation: applyMotivation.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setApplyForPost(null);
      fetchSentApplications();
    } catch (err: any) {
      console.error("Failed to apply", err);
      const msg =
        err?.response?.data?.error || "Failed to apply. Check console for details.";
      alert(msg);
    } finally {
      setApplyLoading(false);
    }
  }

  /* ------------------- EDIT APPLICATION ------------------- */

  function startEditApplication(app: SentApplication) {
    // Only allow if parent post is still open
    if (app.team_posts.status !== "open") return;
    setEditingApplication(app);
    setEditName(app.name || "");
    setEditSkills(app.skills || []);
    setEditProjects(
      (app.projects && app.projects.length ? app.projects : [{ link: "", description: "" }]) as ApplicationProject[]
    );
    setEditMotivation(app.motivation || "");
  }

  function addEditProject() {
    setEditProjects((prev) => [...prev, { link: "", description: "" }]);
  }

  function updateEditProject(idx: number, field: "link" | "description", value: string) {
    setEditProjects((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingApplication || !accessToken) return;

    setEditLoading(true);
    try {
      await axios.put(
        `${API_URL}/teams/applications/${editingApplication.id}`,
        {
          name: editName.trim(),
          skills: editSkills,
          projects: editProjects.filter((p) => p.link.trim()),
          motivation: editMotivation.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setEditingApplication(null);
      fetchSentApplications();
    } catch (err: any) {
      console.error("Failed to update application", err);
      const msg =
        err?.response?.data?.error ||
        "Failed to update application. Check console for details.";
      alert(msg);
    } finally {
      setEditLoading(false);
    }
  }

  /* ------------------- RENDER HELPERS ------------------- */

  function renderTeamPosts() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-semibold text-lg">Find Teammates</h2>
          {user && (
            <Button variant="outline" onClick={() => setShowCreatePostForm((s) => !s)}>
              {showCreatePostForm ? "Cancel" : "Create Team Post"}
            </Button>
          )}
        </div>

        {showCreatePostForm && (
          <form
            onSubmit={handleCreatePost}
            className="mb-8 border rounded-xl p-4 flex flex-col gap-4 bg-white/60 backdrop-blur"
          >
            <h3 className="font-semibold text-base">Post a Team Requirement</h3>

            <Input
              placeholder="Hackathon / Project title"
              value={newPost.title}
              onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
            />

            <Textarea
              placeholder="Short description of what you're building"
              value={newPost.description}
              onChange={(e) => setNewPost((p) => ({ ...p, description: e.target.value }))}
            />

            <Input
              placeholder="Image URL (hackathon banner / project image)"
              value={newPost.image_url}
              onChange={(e) => setNewPost((p) => ({ ...p, image_url: e.target.value }))}
            />

            <Input
              type="number"
              placeholder="Current team members (e.g. 2)"
              value={newPost.current_members}
              onChange={(e) => setNewPost((p) => ({ ...p, current_members: e.target.value }))}
            />

            <Textarea
              placeholder="Requirements (what roles/skills you need)"
              value={newPost.requirements}
              onChange={(e) => setNewPost((p) => ({ ...p, requirements: e.target.value }))}
            />

            <Input
              placeholder="Current project live link (optional)"
              value={newPost.hackathon_link}
              onChange={(e) => setNewPost((p) => ({ ...p, hackathon_link: e.target.value }))}
            />

            <Input
              placeholder="GitHub repo link (optional)"
              value={newPost.github_link}
              onChange={(e) => setNewPost((p) => ({ ...p, github_link: e.target.value }))}
            />

            <Button type="submit" disabled={createPostLoading}>
              {createPostLoading ? "Posting..." : "Publish Requirement"}
            </Button>
          </form>
        )}

        {loadingPosts ? (
          <p>Loading posts...</p>
        ) : teamPosts.length === 0 ? (
          <p className="text-sm text-gray-500">No open team posts yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {teamPosts.map((post) => {
              const isOwner = user && user.id === post.user_id;
              return (
                <div
                  key={post.id}
                  className="border rounded-xl p-4 bg-white/70 backdrop-blur flex flex-col gap-3"
                >
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-base mb-1">{post.title}</h3>
                      {post.description && (
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {post.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {post.current_members != null && (
                    <p className="text-xs text-gray-500">
                      Current team members: {post.current_members}
                    </p>
                  )}

                  {post.requirements && (
                    <p className="text-sm">
                      <span className="font-semibold">Looking for: </span>
                      {post.requirements}
                    </p>
                  )}

                  <div className="flex flex-col gap-1 text-xs mt-1">
                    {post.hackathon_link && (
                      <a
                        href={post.hackathon_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Project / Hackathon Link
                      </a>
                    )}
                    {post.github_link && (
                      <a
                        href={post.github_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        GitHub Repo
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 gap-3">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => startApply(post)}
                      disabled={isOwner}
                    >
                      {isOwner ? "You created this" : "Apply"}
                    </Button>

                    {isOwner && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleClosePost(post)}
                      >
                        Close applications
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderReceivedApplications() {
    if (!user) {
      return <p className="text-sm text-gray-500">Login to see applications for your team.</p>;
    }

    return (
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <h2 className="font-semibold text-lg mb-4">Applications for Your Team</h2>
          {loadingReceived ? (
            <p>Loading applications...</p>
          ) : receivedApplications.length === 0 ? (
            <p className="text-sm text-gray-500">No one has applied yet.</p>
          ) : (
            <div className="space-y-3">
              {receivedApplications.map((app) => (
                <div
                  key={app.id}
                  className="border rounded-xl p-3 bg-white/70 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedReceivedApp(app)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm">{app.name}</p>
                      <p className="text-xs text-gray-500">
                        For: {app.team_posts?.title || "Unknown post"}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-gray-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {app.skills && app.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {app.skills.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {app.motivation && (
                    <p className="mt-2 text-xs text-gray-700 line-clamp-2">
                      {app.motivation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1">
          {selectedReceivedApp ? (
            <div className="border rounded-xl p-4 bg-white/80">
              <h3 className="font-semibold text-base mb-1">{selectedReceivedApp.name}</h3>
              <p className="text-xs text-gray-500 mb-3">
                Applied for: {selectedReceivedApp.team_posts?.title || "Unknown post"}
              </p>

              {selectedReceivedApp.skills && selectedReceivedApp.skills.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold mb-1">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedReceivedApp.skills.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedReceivedApp.projects && selectedReceivedApp.projects.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold mb-1">Projects</p>
                  <div className="space-y-2">
                    {selectedReceivedApp.projects.map((p, idx) => (
                      <div key={idx} className="border rounded-lg p-2 text-xs">
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 font-medium break-all"
                        >
                          {p.link}
                        </a>
                        {p.description && (
                          <p className="mt-1 text-gray-700 whitespace-pre-line">
                            {p.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReceivedApp.motivation && (
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-1">Why they think they fit</p>
                  <p className="text-xs text-gray-800 whitespace-pre-line">
                    {selectedReceivedApp.motivation}
                  </p>
                </div>
              )}

              {/* DM button using existing system */}
              <div className="flex justify-end">
                <DMButton otherUserId={selectedReceivedApp.applicant_id} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-6">
              Click on an application on the left to view full details and DM the applicant.
            </p>
          )}
        </div>
      </div>
    );
  }

  function renderSentApplications() {
    if (!user) {
      return <p className="text-sm text-gray-500">Login to see your applications.</p>;
    }

    return (
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <h2 className="font-semibold text-lg mb-4">Your Applications</h2>
          {loadingSent ? (
            <p>Loading your applications...</p>
          ) : sentApplications.length === 0 ? (
            <p className="text-sm text-gray-500">You haven't applied to any teams yet.</p>
          ) : (
            <div className="space-y-3">
              {sentApplications.map((app) => {
                const closed = app.team_posts?.status === "closed";
                return (
                  <div
                    key={app.id}
                    className="border rounded-xl p-3 bg-white/70 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-sm">
                          {app.team_posts?.title || "Team post"}
                        </p>
                        <p className="text-xs text-gray-500">Applied as: {app.name}</p>
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-wide ${
                          closed ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {closed ? "Application closed" : "Open"}
                      </span>
                    </div>

                    {app.skills && app.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {app.skills.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {app.motivation && (
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {app.motivation}
                      </p>
                    )}

                    <div className="flex justify-end mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={closed}
                        onClick={() => startEditApplication(app)}
                      >
                        {closed ? "Cannot edit (closed)" : "Edit"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* EDIT PANEL */}
        <div className="flex-1">
          {editingApplication ? (
            <form
              onSubmit={handleEditSubmit}
              className="border rounded-xl p-4 bg-white/80 flex flex-col gap-3"
            >
              <h3 className="font-semibold text-base mb-1">Edit Application</h3>
              <p className="text-xs text-gray-500 mb-2">
                For: {editingApplication.team_posts?.title || "Team post"}
              </p>

              <Input
                placeholder="Your name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />

              <div>
                <p className="text-xs font-semibold mb-1">Your skills</p>
                <TagInput value={editSkills} onChange={setEditSkills} />
              </div>

              <div>
                <p className="text-xs font-semibold mb-1">Your projects</p>
                <div className="space-y-2">
                  {editProjects.map((p, idx) => (
                    <div key={idx} className="flex flex-col gap-1 border rounded-lg p-2">
                      <Input
                        placeholder="Project link (GitHub, deployed app, etc.)"
                        value={p.link}
                        onChange={(e) =>
                          updateEditProject(idx, "link", e.target.value)
                        }
                      />
                      <Textarea
                        placeholder="Explain what this project is about"
                        value={p.description}
                        onChange={(e) =>
                          updateEditProject(idx, "description", e.target.value)
                        }
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addEditProject}
                  >
                    + Add another project
                  </Button>
                </div>
              </div>

              <Textarea
                placeholder="Why are you a good fit for this team?"
                value={editMotivation}
                onChange={(e) => setEditMotivation(e.target.value)}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingApplication(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-500 mt-6">
              Select an application on the left to edit it (if the team post is still
              open).
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ------------------- MAIN RENDER ------------------- */

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Team Finder</h1>
        <p className="text-sm text-gray-600 mt-1">
          Find teammates for hackathons & side projects, or apply to join other teams.
        </p>
      </div>

      {/* Tabs under navbar */}
      <div className="flex gap-3 mb-6 border-b border-gray-200">
        <button
          className={`pb-2 text-sm font-medium ${
            activeTab === "find"
              ? "border-b-2 border-black text-black"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("find")}
        >
          Find Teammates
        </button>
        <button
          className={`pb-2 text-sm font-medium ${
            activeTab === "for-team"
              ? "border-b-2 border-black text-black"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("for-team")}
        >
          Applications for your team
        </button>
        <button
          className={`pb-2 text-sm font-medium ${
            activeTab === "your-apps"
              ? "border-b-2 border-black text-black"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("your-apps")}
        >
          Your applications
        </button>
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {activeTab === "find" && renderTeamPosts()}
        {activeTab === "for-team" && renderReceivedApplications()}
        {activeTab === "your-apps" && renderSentApplications()}
      </div>

      {/* APPLY OVERLAY / MODAL-ish */}
      {applyForPost && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-1">
              Apply to join &ldquo;{applyForPost.title}&rdquo;
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Share your skills, projects, and why you&apos;re a good fit.
            </p>

            <form onSubmit={handleApplySubmit} className="flex flex-col gap-3">
              <Input
                placeholder="Your name"
                value={applyName}
                onChange={(e) => setApplyName(e.target.value)}
              />

              <div>
                <p className="text-xs font-semibold mb-1">Your skills</p>
                <TagInput value={applySkills} onChange={setApplySkills} />
              </div>

              <div>
                <p className="text-xs font-semibold mb-1">Your projects</p>
                <div className="space-y-2">
                  {applyProjects.map((p, idx) => (
                    <div key={idx} className="border rounded-lg p-2 flex flex-col gap-1">
                      <Input
                        placeholder="Project link (GitHub, deployed app, etc.)"
                        value={p.link}
                        onChange={(e) =>
                          updateApplyProject(idx, "link", e.target.value)
                        }
                      />
                      <Textarea
                        placeholder="Explain what this project is about"
                        value={p.description}
                        onChange={(e) =>
                          updateApplyProject(idx, "description", e.target.value)
                        }
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addApplyProject}
                  >
                    + Add another project
                  </Button>
                </div>
              </div>

              <Textarea
                placeholder="Why are you the right fit for this team?"
                value={applyMotivation}
                onChange={(e) => setApplyMotivation(e.target.value)}
              />

              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApplyForPost(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={applyLoading}>
                  {applyLoading ? "Submitting..." : "Submit application"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
