// src/pages/Post.tsx
import { motion } from "framer-motion";
import { useState } from "react";
import { Link as LinkIcon, Image as ImageIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import TagInput from "@/components/TagInput";

type PostType = "project" | "blog" | null;
type FormState = "idle" | "loading" | "success" | "error";

const API_URL = import.meta.env.VITE_API_URL as string;

const normalizeTags = (raw: string[]) => {
  const cleaned = raw
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(cleaned));
};

const Post = () => {
  const [postType, setPostType] = useState<PostType>(null);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { accessToken, session, profile, signInWithGoogle } = useAuth();

  // Project form state
  const [projectLink, setProjectLink] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectLogoUrl, setProjectLogoUrl] = useState("");
  const [projectScreenshotUrls, setProjectScreenshotUrls] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectDetailedWriteup, setProjectDetailedWriteup] = useState("");
  const [projectGithubLink, setProjectGithubLink] = useState("");
  const [projectTags, setProjectTags] = useState<string[]>([]);

  // Blog form state
  const [blogTitle, setBlogTitle] = useState("");
  const [blogImageUrls, setBlogImageUrls] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogTags, setBlogTags] = useState<string[]>([]);

  const requireAuth = () => {
    if (!session) {
      setErrorMessage("You need to sign in with Google before posting.");
      return false;
    }
    if (!accessToken) {
      setErrorMessage("Auth token not found, try signing in again.");
      return false;
    }
    return true;
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!requireAuth()) return;

    try {
      setFormState("loading");

      const body = {
        type: "project",
        title: projectTitle,
        content: projectDetailedWriteup,
        short_description: projectDescription,
        project_link: projectLink || null,
        github_link: projectGithubLink || null,
        cover_image_url: projectLogoUrl || null,
        images: projectScreenshotUrls
          ? projectScreenshotUrls
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        tags: normalizeTags(projectTags),
      };

      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to publish project");
      }

      setFormState("success");

      // Reset form after a short delay
      setTimeout(() => {
        setFormState("idle");
        setPostType(null);
        setProjectLink("");
        setProjectTitle("");
        setProjectLogoUrl("");
        setProjectScreenshotUrls("");
        setProjectDescription("");
        setProjectDetailedWriteup("");
        setProjectGithubLink("");
        setProjectTags([]);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Something went wrong");
      setFormState("error");
    }
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!requireAuth()) return;

    try {
      setFormState("loading");

      const body = {
        type: "blog",
        title: blogTitle,
        content: blogContent,
        short_description: blogContent.slice(0, 160),
        project_link: null,
        github_link: null,
        cover_image_url: null,
        images: blogImageUrls
          ? blogImageUrls
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        tags: normalizeTags(blogTags),
      };

      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to publish blog");
      }

      setFormState("success");

      setTimeout(() => {
        setFormState("idle");
        setPostType(null);
        setBlogTitle("");
        setBlogImageUrls("");
        setBlogContent("");
        setBlogTags([]);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Something went wrong");
      setFormState("error");
    }
  };

  // UI
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <h1 className="text-3xl font-bold mb-6 text-center text-foreground">
          Share Your Work
        </h1>

        {!session && (
          <div className="mb-6 p-4 border border-yellow-300 rounded-lg bg-yellow-50 text-sm text-yellow-800 text-center">
            You are not logged in.{" "}
            <button
              className="font-semibold underline"
              onClick={signInWithGoogle}
            >
              Click here to sign in with Google
            </button>{" "}
            to publish projects and blogs.
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        {formState === "success" && (
          <div className="mb-4 p-3 rounded-md bg-green-100 text-green-700 text-sm text-center">
            Your {postType === "project" ? "project" : "blog"} has been
            published!
          </div>
        )}

        {/* Select type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPostType("project")}
            className={`p-6 border-2 rounded-xl transition-colors bg-card space-y-4 ${
              postType === "project" ? "border-primary" : "border-border"
            }`}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Project</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Share your website or application
              </p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPostType("blog")}
            className={`p-6 border-2 rounded-xl transition-colors bg-card space-y-4 ${
              postType === "blog" ? "border-primary" : "border-border"
            }`}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Blog</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Write and share your dev blogs
              </p>
            </div>
          </motion.button>
        </div>

        {/* Forms */}
        {postType === "project" && (
          <motion.form
            onSubmit={handleProjectSubmit}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 bg-card p-6 rounded-xl border border-border"
          >
            <div className="space-y-2">
              <Label htmlFor="project-title">Project Title</Label>
              <Input
                id="project-title"
                placeholder="My Awesome Portfolio"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-link">
                Live Project Link <LinkIcon className="inline w-4 h-4" />
              </Label>
              <Input
                id="project-link"
                type="url"
                placeholder="https://your-project.com"
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-github">
                GitHub Repo Link (optional)
              </Label>
              <Input
                id="project-github"
                type="url"
                placeholder="https://github.com/you/your-project"
                value={projectGithubLink}
                onChange={(e) => setProjectGithubLink(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-logo-url">Project Logo Image URL</Label>
              <Input
                id="project-logo-url"
                type="url"
                placeholder="https://example.com/logo.png"
                value={projectLogoUrl}
                onChange={(e) => setProjectLogoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste a direct image URL. File uploads can be added later.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-screenshots">
                Screenshot Image URLs (one per line)
              </Label>
              <Textarea
                id="project-screenshots"
                placeholder={"https://example.com/shot1.png\nhttps://example.com/shot2.png"}
                value={projectScreenshotUrls}
                onChange={(e) => setProjectScreenshotUrls(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Short Description</Label>
              <Textarea
                id="project-description"
                placeholder="A short description shown on the card."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tags / Tech Stack</Label>
              <TagInput value={projectTags} onChange={setProjectTags} />
              <p className="text-xs text-muted-foreground">Add tags like react, tailwind, supabase</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-detailed">
                Detailed Writeup (shown on project page)
              </Label>
              <Textarea
                id="project-detailed"
                placeholder="Explain the problem, tech stack, features…"
                value={projectDetailedWriteup}
                onChange={(e) => setProjectDetailedWriteup(e.target.value)}
                rows={6}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={formState === "loading"}>
              {formState === "loading" ? "Publishing..." : "Publish Project"}
            </Button>
          </motion.form>
        )}

        {postType === "blog" && (
          <motion.form
            onSubmit={handleBlogSubmit}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 bg-card p-6 rounded-xl border border-border"
          >
            <div className="space-y-2">
              <Label htmlFor="blog-title">Blog Title</Label>
              <Input
                id="blog-title"
                placeholder="What I learned building DevConnect"
                value={blogTitle}
                onChange={(e) => setBlogTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-images">
                Image URLs (one per line, optional)
              </Label>
              <Textarea
                id="blog-images"
                placeholder={"https://example.com/blog-image1.png"}
                value={blogImageUrls}
                onChange={(e) => setBlogImageUrls(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags / Topics</Label>
              <TagInput value={blogTags} onChange={setBlogTags} />
              <p className="text-xs text-muted-foreground">Add tags like tutorial, react, supabase</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-content">Blog Content</Label>
              <Textarea
                id="blog-content"
                placeholder="Write your blog here..."
                value={blogContent}
                onChange={(e) => setBlogContent(e.target.value)}
                rows={8}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={formState === "loading"}>
              {formState === "loading" ? "Publishing..." : "Publish Blog"}
            </Button>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};

export default Post;
