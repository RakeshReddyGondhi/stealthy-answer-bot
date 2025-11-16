import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import VoiceChatInterface from "./components/VoiceChatInterface";
import useAdminControl from "@/hooks/useAdminControl";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const queryClient = new QueryClient();

declare global {
  interface Window {
    electronAPI?: {
      showOverlay: (text: string) => void;
      hideOverlay: () => void;
    };
  }
}

const App = () => {
  const { appLocked } = useAdminControl();
  const { isAdmin } = useAuth();
  const showAppLocked = appLocked && !isAdmin;

  // Use useEffect to handle overlay updates
  useEffect(() => {
    if (showAppLocked && window.electronAPI) {
      window.electronAPI.showOverlay("App is locked by admin. Access denied.");
    } else if (window.electronAPI) {
      window.electronAPI.hideOverlay();
    }
  }, [showAppLocked]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          {showAppLocked ? (
            <div className="flex items-center justify-center min-h-screen">
              <p className="text-lg font-semibold">
                App is locked by admin. Access denied.
              </p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/voice" element={<VoiceChatInterface />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
