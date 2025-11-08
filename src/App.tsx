import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MobileLayout } from "./components/MobileLayout";
import ClientsPage from "./pages/Clients";
import InquiriesPage from "./pages/Inquiries";
import EventsPage from "./pages/Events";
import CalendarPage from "./pages/Calendar";
import DashboardPage from "./pages/Dashboard";
import LeadsPage from "./pages/Leads"; // Import the new LeadsPage
import NotFound from "./pages/NotFound";
import { AppProvider } from "./context/AppContext";
import { SessionContextProvider, useSession } from "./components/SessionContextProvider";
import Login from "./pages/Login";
import React from "react";

const queryClient = new QueryClient();

// A wrapper component to protect routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-white">Loading user session...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <AppProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><MobileLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/clients" replace />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/inquiries" element={<InquiriesPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/leads" element={<LeadsPage />} /> {/* New Leads route */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </AppProvider>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;