import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { useAuthStore } from '@/lib/authStore';
import { CallDetailPage } from '@/pages/CallDetail';
import { CallsPage } from '@/pages/Calls';
import { CampaignBuilderPage } from '@/pages/CampaignBuilder';
import { CampaignsPage } from '@/pages/Campaigns';
import { CustomersPage } from '@/pages/Customers';
import { DashboardLayout } from '@/pages/DashboardLayout';
import { LandingPage } from '@/pages/Landing';
import { LiveMonitorPage } from '@/pages/LiveMonitor';
import { LoginPage } from '@/pages/Login';
import { SignupPage } from '@/pages/Signup';
import { SettingsPage } from '@/pages/Settings';
import { DashboardHomePage } from '@/pages/DashboardHome';
import { AnalyticsPage } from '@/pages/Analytics';
import { KnowledgeBasePage } from '@/pages/KnowledgeBase';
import { AutomationsPage } from '@/pages/Automations';
import { VoiceProfilesPage } from '@/pages/VoiceProfiles';
import { AIProvidersPage } from '@/pages/AIProviders';
import { BillingPage } from '@/pages/Billing';
import { AdminPanelPage } from '@/pages/AdminPanel';
import { LeadFormsPage } from '@/pages/LeadForms';
import { CustomFieldsPage } from '@/pages/CustomFields';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute() {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardHomePage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/campaigns/new" element={<CampaignBuilderPage />} />
              <Route path="/campaigns/:id/edit" element={<CampaignBuilderPage />} />
              <Route path="/monitor" element={<LiveMonitorPage />} />
              <Route path="/calls" element={<CallsPage />} />
              <Route path="/calls/:id" element={<CallDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/knowledge" element={<KnowledgeBasePage />} />
              <Route path="/automations" element={<AutomationsPage />} />
              <Route path="/voice" element={<VoiceProfilesPage />} />
              <Route path="/providers" element={<AIProvidersPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/admin" element={<AdminPanelPage />} />
              <Route path="/lead-forms" element={<LeadFormsPage />} />
              <Route path="/custom-fields" element={<CustomFieldsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
