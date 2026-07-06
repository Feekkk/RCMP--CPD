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
import { TrackRequisition } from "./staff/TrackRequisition.tsx";
import { Settings } from "./staff/Settings.tsx";
import { AdminDashboardPage } from "./admin/Dashboard.tsx";
import { AdminHistoryPage } from "./admin/History.tsx";
import { AdminTrackRequisitionPage } from "./admin/TrackRequisition.tsx";
import { AdminReportPage } from "./admin/Report.tsx";
import { AdminRequisitionsPage } from "./admin/Requisitions.tsx";
import { AdminSettingsPage } from "./admin/Settings.tsx";
import { AdminUsersPage } from "./admin/Users.tsx";
import { AdminVerifyRequisitionPage } from "./admin/ReviewReq.tsx";
import { HODDashboardPage } from "./HOD/Dashboard.tsx";
import { HODHistoryPage } from "./HOD/History.tsx";
import { HODRequisitionsPage } from "./HOD/Requisitions.tsx";
import { HODReviewQueuePage } from "./HOD/ReviewQueue.tsx";
import { HODSettingsPage } from "./HOD/Settings.tsx";
import { HODTrackRequisitionPage } from "./HOD/TrackRequisition.tsx";
import { ApprovalDashboardPage } from "./approval/dashboard.tsx";
import { ApprovalQueuePage } from "./approval/Approval.tsx";
import { ApprovalReportPage } from "./approval/Report.tsx";
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
          <Route path="/staff/requisition/track" element={<TrackRequisition />} />
          <Route path="/staff/history" element={<History />} />
          <Route path="/staff/settings" element={<Settings />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/requisitions" element={<AdminRequisitionsPage />} />
          <Route path="/admin/verify-requisition" element={<AdminVerifyRequisitionPage />} />
          <Route path="/admin/report" element={<AdminReportPage />} />
          <Route path="/admin/history" element={<AdminHistoryPage />} />
          <Route path="/admin/requisition/track" element={<AdminTrackRequisitionPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />

          {/* HOD Routes */}
          <Route path="/hod/dashboard" element={<HODDashboardPage />} />
          <Route path="/hod/requisitions" element={<HODRequisitionsPage />} />
          <Route path="/hod/review-queue" element={<HODReviewQueuePage />} />
          <Route path="/hod/requisition/track" element={<HODTrackRequisitionPage />} />
          <Route path="/hod/history" element={<HODHistoryPage />} />
          <Route path="/hod/settings" element={<HODSettingsPage />} />

          {/* Approval Routes */}
          <Route path="/approval/dashboard" element={<ApprovalDashboardPage />} />
          <Route path="/approval/report" element={<ApprovalReportPage />} />
          <Route path="/approval/approval" element={<ApprovalQueuePage />} />

          {/* Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
