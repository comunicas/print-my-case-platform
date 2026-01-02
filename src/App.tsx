import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProductModalProvider } from "@/contexts/ProductModalContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load das páginas
const Index = lazy(() => import("./pages/Index"));
const Uploads = lazy(() => import("./pages/Uploads"));
const UploadDetails = lazy(() => import("./pages/UploadDetails"));
const Stock = lazy(() => import("./pages/Stock"));
const Settings = lazy(() => import("./pages/Settings"));
const Organizations = lazy(() => import("./pages/Organizations"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicStock = lazy(() => import("./pages/PublicStock"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - dados ficam "fresh"
      gcTime: 30 * 60 * 1000, // 30 minutos - mantém em cache
      refetchOnWindowFocus: false, // Não recarrega ao focar janela
      retry: 1, // Apenas 1 retry em caso de erro
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ProductModalProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/catalogo/:orgSlug" element={<PublicStock />} />
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
                </Suspense>
              </ProductModalProvider>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
);

export default App;
