import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/login.tsx";
import { StaffDashboardPage } from "./staff/dashboard.tsx";
import { History } from "./staff/History.tsx";
import { Requisition } from "./staff/Requisition.tsx";
import { Settings } from "./staff/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          
          {/* Homepage */}
          <Route path="/" element={<Index />} />

          {/* Staff Routes */}
          <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
          <Route path="/staff/requisition" element={<Requisition />} />
          <Route path="/staff/history" element={<History />} />
          <Route path="/staff/settings" element={<Settings />} />

          {/* Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
