import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
import Chats from "./pages/Chats"; // ✅ DM LIST PAGE

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />

              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetails />} />

              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/:id" element={<BlogDetails />} />

              <Route path="/post/:id" element={<Post />} />
              <Route path="/post" element={<Post />} />

              {/* Current User Profile */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/starred" element={<StarredPosts />} />

              {/* Edit Profile */}
              <Route path="/edit-profile" element={<EditProfile />} />

              {/* Public User Profile */}
              <Route path="/user/:userId" element={<PublicProfile />} />

              {/* ✅ CHAT ROUTES */}
              <Route path="/chats" element={<Chats />} />
              <Route path="/chat/:chatId" element={<ChatPage />} />

              <Route path="/teams" element={<TeamFinder />} />


              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>

        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
