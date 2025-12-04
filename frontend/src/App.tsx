import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import InterviewRoom from "./pages/InterviewRoom";
import Lobby from "./pages/Lobby";
import Demo from "./pages/Demo";
import Profile from "./pages/Profile";
import Templates from "./pages/Templates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthInitializer>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/interview/:id" element={<InterviewRoom />} />
          <Route path="/lobby/:id" element={<Lobby />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/templates" element={<Templates />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
