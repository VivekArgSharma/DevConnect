// src/pages/TeamFinder.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagInput from "@/components/TagInput";
import DMButton from "@/components/DMButton";
import { Users, Plus, Send, Inbox, ExternalLink, Github, X, Loader2 } from "lucide-react";
import Squares from "@/components/ui/Squares";

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
  };
};

type SentApplication = ReceivedApplication;

type ActiveTab = "find" | "for-team" | "your-apps";

export default function TeamFinder() {
  const { user, accessToken } = useAuth() as any;

  const [activeTab, setActiveTab] = useState<ActiveTab>("find");

  const [teamPosts, setTeamPosts] = useState<TeamPost[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<
    ReceivedApplication[]
  >([]);
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

  const [selectedReceivedApp, setSelectedReceivedApp] =
    useState<ReceivedApplication | null>(null);
  const [editingApplication, setEditingApplication] =
    useState<SentApplication | null>(null);
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

  function updateApplyProject(
    idx: number,
    field: "link" | "description",
    value: string
  ) {
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
    if (app.team_posts.status !== "open") return;
    setEditingApplication(app);
    setEditName(app.name || "");
    setEditSkills(app.skills || []);
    setEditProjects(
      (app.projects && app.projects.length
        ? app.projects
        : [{ link: "", description: "" }]) as ApplicationProject[]
    );
    setEditMotivation(app.motivation || "");
  }

  function addEditProject() {
    setEditProjects((prev) => [...prev, { link: "", description: "" }]);
  }

  function updateEditProject(
    idx: number,
    field: "link" | "description",
    value: string
  ) {
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

  /* ------------------- DELETE APPLICATION ------------------- */

  async function handleDeleteApplication(appId: string) {
    if (!accessToken) return;
    const ok = window.confirm(
      "Are you sure you want to delete this application? This cannot be undone."
    );
    if (!ok) return;

    try {
      await axios.delete(`${API_URL}/teams/applications/${appId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setSentApplications((prev) => prev.filter((a) => a.id !== appId));
      setReceivedApplications((prev) => prev.filter((a) => a.id !== appId));

      if (selectedReceivedApp?.id === appId) {
        setSelectedReceivedApp(null);
      }
      if (editingApplication?.id === appId) {
        setEditingApplication(null);
      }
    } catch (err: any) {
      console.error("Failed to delete application", err);
      const msg =
        err?.response?.data?.error ||
        "Failed to delete application. Check console for details.";
      alert(msg);
    }
  }

  /* ------------------- RENDER HELPERS ------------------- */

  const tabs = [
    { id: "find" as const, label: "Find Teammates", icon: Users },
    { id: "for-team" as const, label: "Received", icon: Inbox },
    { id: "your-apps" as const, label: "Sent", icon: Send },
  ];

  function renderTeamPosts() {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Open Teams</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse teams looking for members
            </p>
          </div>
          {user && (
            <Button
              onClick={() => setShowCreatePostForm((s) => !s)}
              className="gap-2"
            >
              {showCreatePostForm ? (
                <>
                  <X className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Post Team
                </>
              )}
            </Button>
          )}
        </div>

        {/* Create Post Form */}
        {showCreatePostForm && (
          <form
            onSubmit={handleCreatePost}
            className="rounded-2xl border border-border bg-card p-6 space-y-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Create Team Post</h3>
                <p className="text-xs text-muted-foreground">Share what you're building</p>
              </div>
            </div>

            <Input
              placeholder="Project / Hackathon title"
              value={newPost.title}
              onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
            />

            <Textarea
              placeholder="What are you building? Describe your project..."
              value={newPost.description}
              onChange={(e) =>
                setNewPost((p) => ({ ...p, description: e.target.value }))
              }
              className="min-h-[100px]"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Banner image URL (optional)"
                value={newPost.image_url}
                onChange={(e) =>
                  setNewPost((p) => ({ ...p, image_url: e.target.value }))
                }
              />
              <Input
                type="number"
                placeholder="Current team size"
                value={newPost.current_members}
                onChange={(e) =>
                  setNewPost((p) => ({ ...p, current_members: e.target.value }))
                }
              />
            </div>

            <Textarea
              placeholder="What skills/roles are you looking for?"
              value={newPost.requirements}
              onChange={(e) =>
                setNewPost((p) => ({ ...p, requirements: e.target.value }))
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Live project link (optional)"
                value={newPost.hackathon_link}
                onChange={(e) =>
                  setNewPost((p) => ({ ...p, hackathon_link: e.target.value }))
                }
              />
              <Input
                placeholder="GitHub repo (optional)"
                value={newPost.github_link}
                onChange={(e) =>
                  setNewPost((p) => ({ ...p, github_link: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={createPostLoading} className="gap-2">
                {createPostLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish"
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Posts Grid */}
        {loadingPosts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : teamPosts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/50">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No open teams yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Be the first to post!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {teamPosts.map((post) => {
              const isOwner = user && user.id === post.user_id;
              return (
                <div
                  key={post.id}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all duration-300"
                >
                  {post.image_url && (
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                    </div>
                  )}

                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {post.description}
                        </p>
                      )}
                    </div>

                    {post.current_members != null && (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(post.current_members, 4))].map((_, i) => (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center"
                            >
                              <span className="text-xs text-primary font-medium">
                                {i + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {post.current_members} member{post.current_members !== 1 && "s"}
                        </span>
                      </div>
                    )}

                    {post.requirements && (
                      <div className="p-3 rounded-xl bg-muted/50">
                        <p className="text-xs font-medium text-primary mb-1">Looking for</p>
                        <p className="text-sm text-foreground line-clamp-2">
                          {post.requirements}
                        </p>
                      </div>
                    )}

                    {(post.hackathon_link || post.github_link) && (
                      <div className="flex flex-wrap gap-2">
                        {post.hackathon_link && (
                          <a
                            href={post.hackathon_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Project
                          </a>
                        )}
                        {post.github_link && (
                          <a
                            href={post.github_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                          >
                            <Github className="w-3.5 h-3.5" />
                            GitHub
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => startApply(post)}
                        disabled={isOwner}
                        className="flex-1"
                      >
                        {isOwner ? "Your post" : "Apply"}
                      </Button>

                      {isOwner && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleClosePost(post)}
                        >
                          Close
                        </Button>
                      )}
                    </div>
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
      return (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/50">
          <Inbox className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Login to see received applications</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* List */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Received Applications</h2>
            <p className="text-sm text-muted-foreground mt-1">
              People who want to join your teams
            </p>
          </div>

          {loadingReceived ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : receivedApplications.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/50">
              <Inbox className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {receivedApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedReceivedApp(app)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                    selectedReceivedApp?.id === app.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{app.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        For: {app.team_posts?.title || "Unknown"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {app.skills && app.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {app.skills.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                        >
                          {s}
                        </span>
                      ))}
                      {app.skills.length > 4 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          +{app.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="flex-1">
          {selectedReceivedApp ? (
            <div className="sticky top-4 rounded-2xl border border-border bg-card p-6 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedReceivedApp.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Applied for: {selectedReceivedApp.team_posts?.title}
                </p>
              </div>

              {selectedReceivedApp.skills && selectedReceivedApp.skills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedReceivedApp.skills.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedReceivedApp.projects && selectedReceivedApp.projects.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Projects</p>
                  <div className="space-y-2">
                    {selectedReceivedApp.projects.map((p, idx) => (
                      <div key={idx} className="rounded-xl bg-muted/50 p-3">
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary hover:underline font-medium break-all"
                        >
                          {p.link}
                        </a>
                        {p.description && (
                          <p className="mt-1.5 text-sm text-muted-foreground whitespace-pre-line">
                            {p.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReceivedApp.motivation && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Why they're a good fit
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {selectedReceivedApp.motivation}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <DMButton otherUserId={selectedReceivedApp.applicant_id} />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteApplication(selectedReceivedApp.id)}
                >
                  Mark reviewed
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/50">
              <p className="text-muted-foreground">Select an application to view details</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderSentApplications() {
    if (!user) {
      return (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/50">
          <Send className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Login to see your applications</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* List */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Your Applications</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track your team applications
            </p>
          </div>

          {loadingSent ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : sentApplications.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/50">
              <Send className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No applications sent yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Find a team to join!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentApplications.map((app) => {
                const closed = app.team_posts?.status === "closed";
                return (
                  <div
                    key={app.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">
                          {app.team_posts?.title || "Team post"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Applied as: {app.name}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          closed
                            ? "bg-destructive/10 text-destructive"
                            : "bg-green-500/10 text-green-600"
                        }`}
                      >
                        {closed ? "Closed" : "Open"}
                      </span>
                    </div>

                    {app.skills && app.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {app.skills.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={closed}
                        onClick={() => startEditApplication(app)}
                      >
                        {closed ? "Locked" : "Edit"}
                      </Button>
                      {closed && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteApplication(app.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit Panel */}
        <div className="flex-1">
          {editingApplication ? (
            <form
              onSubmit={handleEditSubmit}
              className="sticky top-4 rounded-2xl border border-border bg-card p-6 space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold text-foreground">Edit Application</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  For: {editingApplication.team_posts?.title}
                </p>
              </div>

              <Input
                placeholder="Your name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Your skills</p>
                <TagInput value={editSkills} onChange={setEditSkills} />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Your projects</p>
                <div className="space-y-2">
                  {editProjects.map((p, idx) => (
                    <div key={idx} className="rounded-xl bg-muted/50 p-3 space-y-2">
                      <Input
                        placeholder="Project link"
                        value={p.link}
                        onChange={(e) => updateEditProject(idx, "link", e.target.value)}
                      />
                      <Textarea
                        placeholder="Brief description"
                        value={p.description}
                        onChange={(e) => updateEditProject(idx, "description", e.target.value)}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addEditProject}
                    className="gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add project
                  </Button>
                </div>
              </div>

              <Textarea
                placeholder="Why are you a good fit?"
                value={editMotivation}
                onChange={(e) => setEditMotivation(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingApplication(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editLoading} className="gap-2">
                  {editLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card/50">
              <p className="text-muted-foreground">Select an application to edit</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ------------------- MAIN RENDER ------------------- */

  return (
    <>
      <div className="fixed inset-0 -z-10">
        <Squares
          direction="diagonal"
          speed={0.3}
          borderColor="hsl(var(--border) / 0.3)"
          squareSize={50}
          hoverFillColor="hsl(var(--primary) / 0.1)"
        />
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8 relative">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team Finder</h1>
            <p className="text-muted-foreground">
              Find teammates for hackathons & projects
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1 rounded-xl bg-muted/50 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "find" && renderTeamPosts()}
        {activeTab === "for-team" && renderReceivedApplications()}
        {activeTab === "your-apps" && renderSentApplications()}
      </div>

      {/* Apply Modal */}
      {applyForPost && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Apply to join "{applyForPost.title}"
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Share your skills and experience
                </p>
              </div>
              <button
                onClick={() => setApplyForPost(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <Input
                placeholder="Your name"
                value={applyName}
                onChange={(e) => setApplyName(e.target.value)}
              />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Your skills</p>
                <TagInput value={applySkills} onChange={setApplySkills} />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Your projects</p>
                <div className="space-y-2">
                  {applyProjects.map((p, idx) => (
                    <div key={idx} className="rounded-xl bg-muted/50 p-3 space-y-2">
                      <Input
                        placeholder="Project link"
                        value={p.link}
                        onChange={(e) => updateApplyProject(idx, "link", e.target.value)}
                      />
                      <Textarea
                        placeholder="Brief description"
                        value={p.description}
                        onChange={(e) => updateApplyProject(idx, "description", e.target.value)}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addApplyProject}
                    className="gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add project
                  </Button>
                </div>
              </div>

              <Textarea
                placeholder="Why are you the right fit for this team?"
                value={applyMotivation}
                onChange={(e) => setApplyMotivation(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApplyForPost(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={applyLoading} className="gap-2">
                  {applyLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
