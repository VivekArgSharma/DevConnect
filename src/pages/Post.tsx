import { motion } from "framer-motion";
import { useState } from "react";
import { Upload, Link, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type PostType = "project" | "blog" | null;
type FormState = "idle" | "loading" | "success";

const Post = () => {
  const [postType, setPostType] = useState<PostType>(null);
  const [formState, setFormState] = useState<FormState>("idle");

  // Project form state
  const [projectLink, setProjectLink] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectLogo, setProjectLogo] = useState<File | null>(null);
  const [projectScreenshots, setProjectScreenshots] = useState<FileList | null>(null);
  const [projectDescription, setProjectDescription] = useState("");
  const [projectDetailedWriteup, setProjectDetailedWriteup] = useState("");

  // Blog form state
  const [blogTitle, setBlogTitle] = useState("");
  const [blogImages, setBlogImages] = useState<FileList | null>(null);
  const [blogContent, setBlogContent] = useState("");

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    setTimeout(() => {
      setFormState("success");
      setTimeout(() => {
        setFormState("idle");
        setPostType(null);
        // Reset form
        setProjectLink("");
        setProjectTitle("");
        setProjectLogo(null);
        setProjectScreenshots(null);
        setProjectDescription("");
        setProjectDetailedWriteup("");
      }, 2000);
    }, 1500);
  };

  const handleBlogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    setTimeout(() => {
      setFormState("success");
      setTimeout(() => {
        setFormState("idle");
        setPostType(null);
        // Reset form
        setBlogTitle("");
        setBlogImages(null);
        setBlogContent("");
      }, 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        {formState === "success" ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M27.6 16C27.6 17.5234 27.3 19.0318 26.717 20.4392C26.1341 21.8465 25.2796 23.1253 24.2025 24.2025C23.1253 25.2796 21.8465 26.1341 20.4392 26.717C19.0318 27.3 17.5234 27.6 16 27.6C14.4767 27.6 12.9683 27.3 11.5609 26.717C10.1535 26.1341 8.87475 25.2796 7.79759 24.2025C6.72043 23.1253 5.86598 21.8465 5.28302 20.4392C4.70007 19.0318 4.40002 17.5234 4.40002 16C4.40002 12.9235 5.62216 9.97301 7.79759 7.79759C9.97301 5.62216 12.9235 4.40002 16 4.40002C19.0765 4.40002 22.027 5.62216 24.2025 7.79759C26.3779 9.97301 27.6 12.9235 27.6 16Z"
                  fill="currentColor"
                  fillOpacity="0.16"
                  className="text-primary"
                />
                <path
                  d="M12.1334 16.9667L15.0334 19.8667L19.8667 13.1M27.6 16C27.6 17.5234 27.3 19.0318 26.717 20.4392C26.1341 21.8465 25.2796 23.1253 24.2025 24.2025C23.1253 25.2796 21.8465 26.1341 20.4392 26.717C19.0318 27.3 17.5234 27.6 16 27.6C14.4767 27.6 12.9683 27.3 11.5609 26.717C10.1535 26.1341 8.87475 25.2796 7.79759 24.2025C6.72043 23.1253 5.86598 21.8465 5.28302 20.4392C4.70007 19.0318 4.40002 17.5234 4.40002 16C4.40002 12.9235 5.62216 9.97301 7.79759 7.79759C9.97301 5.62216 12.9235 4.40002 16 4.40002C19.0765 4.40002 22.027 5.62216 24.2025 7.79759C26.3779 9.97301 27.6 12.9235 27.6 16Z"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Successfully Posted!</h2>
            <p className="text-muted-foreground">Your {postType} has been submitted successfully.</p>
          </motion.div>
        ) : !postType ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-foreground">Share Your Work</h1>
              <p className="text-muted-foreground">What would you like to upload?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPostType("project")}
                className="p-8 border-2 border-border rounded-xl hover:border-primary transition-colors bg-card space-y-4"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Link className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Project</h3>
                  <p className="text-sm text-muted-foreground mt-2">Share your website or application</p>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPostType("blog")}
                className="p-8 border-2 border-border rounded-xl hover:border-primary transition-colors bg-card space-y-4"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Blog</h3>
                  <p className="text-sm text-muted-foreground mt-2">Write and share your thoughts</p>
                </div>
              </motion.button>
            </div>
          </div>
        ) : postType === "project" ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground">Upload Project</h2>
              <Button variant="ghost" onClick={() => setPostType(null)}>Back</Button>
            </div>
            <form onSubmit={handleProjectSubmit} className="space-y-6 bg-card border border-border rounded-xl p-6">
              <div className="space-y-2">
                <Label htmlFor="project-title">Project Title</Label>
                <Input
                  id="project-title"
                  placeholder="Enter your project title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-link">Project Link</Label>
                <Input
                  id="project-link"
                  type="url"
                  placeholder="https://your-project.com"
                  value={projectLink}
                  onChange={(e) => setProjectLink(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-logo">Project Logo (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="project-logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProjectLogo(e.target.files?.[0] || null)}
                  />
                  <Image className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-screenshots">Screenshots</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="project-screenshots"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setProjectScreenshots(e.target.files)}
                    required
                  />
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Upload multiple screenshots</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Short Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Brief description of your project"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-writeup">Detailed Write-up</Label>
                <Textarea
                  id="project-writeup"
                  placeholder="Detailed description that will be displayed when users view your project"
                  value={projectDetailedWriteup}
                  onChange={(e) => setProjectDetailedWriteup(e.target.value)}
                  rows={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={formState === "loading"}>
                {formState === "loading" ? "Submitting..." : "Submit Project"}
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground">Write Blog Post</h2>
              <Button variant="ghost" onClick={() => setPostType(null)}>Back</Button>
            </div>
            <form onSubmit={handleBlogSubmit} className="space-y-6 bg-card border border-border rounded-xl p-6">
              <div className="space-y-2">
                <Label htmlFor="blog-title">Blog Title</Label>
                <Input
                  id="blog-title"
                  placeholder="Enter your blog title"
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-images">Images (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="blog-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setBlogImages(e.target.files)}
                  />
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Upload images for your blog post</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-content">Blog Content</Label>
                <Textarea
                  id="blog-content"
                  placeholder="Write your blog content here..."
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  rows={12}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={formState === "loading"}>
                {formState === "loading" ? "Publishing..." : "Publish Blog"}
              </Button>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Post;