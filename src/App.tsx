import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import Layout from "./components/Layout";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Blogs from "./pages/Blogs";
import Post from "./pages/Post";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ProjectDetails from "./pages/ProjectDetails";
import BlogDetails from "./pages/BlogDetails";
import PublicProfile from "./pages/PublicProfile";
import EditProfile from "./pages/EditProfile";
import TeamFinder from "./pages/TeamFinder";
import StarredPosts from "./pages/StarredPosts";

// ✅ CHAT PAGES
import ChatPage from "./pages/ChatPage";
import Chats from "./pages/Chats";

// ✅ ADMIN PAGE
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" themes={["light", "dark", "rose"]}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                {/* HOME */}
                <Route path="/" element={<Index />} />

                {/* PROJECTS */}
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />

                {/* BLOGS */}
                <Route path="/blogs" element={<Blogs />} />
                <Route path="/blogs/:id" element={<BlogDetails />} />

                {/* CREATE POST */}
                <Route path="/post/:id" element={<Post />} />
                <Route path="/post" element={<Post />} />

                {/* PROFILE */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/starred" element={<StarredPosts />} />
                <Route path="/edit-profile" element={<EditProfile />} />

                {/* PUBLIC PROFILE */}
                <Route path="/user/:userId" element={<PublicProfile />} />

                {/* CHAT */}
                <Route path="/chats" element={<Chats />} />
                <Route path="/chat/:chatId" element={<ChatPage />} />

                {/* TEAMS */}
                <Route path="/teams" element={<TeamFinder />} />

                {/* 🔒 ADMIN (BACKEND SECURED) */}
                <Route path="/admin" element={<AdminDashboard />} />

                {/* FALLBACK */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>

          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
