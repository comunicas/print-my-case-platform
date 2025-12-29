import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProductModalProvider } from "@/contexts/ProductModalContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Uploads from "./pages/Uploads";
import UploadDetails from "./pages/UploadDetails";
import Stock from "./pages/Stock";
import Settings from "./pages/Settings";
import Organizations from "./pages/Organizations";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <ProductModalProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/uploads" element={<ProtectedRoute><Uploads /></ProtectedRoute>} />
                <Route path="/uploads/:id" element={<ProtectedRoute><UploadDetails /></ProtectedRoute>} />
                <Route path="/estoque" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
                <Route path="/reports" element={<Navigate to="/estoque" replace />} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/organizations" element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
                {/* Redirects for old routes */}
                <Route path="/pdvs" element={<Navigate to="/settings?tab=pdvs" replace />} />
                <Route path="/team" element={<Navigate to="/settings?tab=team" replace />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ProductModalProvider>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
