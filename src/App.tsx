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
import { AdminDashboardPage } from "./admin/Dashboard.tsx";
import { AdminHistoryPage } from "./admin/History.tsx";
import { AdminReportPage } from "./admin/Report.tsx";
import { AdminRequisitionsPage } from "./admin/Requisitions.tsx";
import { AdminSettingsPage } from "./admin/Settings.tsx";
import { AdminUsersPage } from "./admin/Users.tsx";
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

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/requisitions" element={<AdminRequisitionsPage />} />
          <Route path="/admin/report" element={<AdminReportPage />} />
          <Route path="/admin/history" element={<AdminHistoryPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />

          {/* Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
