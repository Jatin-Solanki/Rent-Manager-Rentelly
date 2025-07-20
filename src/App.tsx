import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RentRoostProvider } from "@/context/RentRoostContext";
import { AuthProvider } from "@/context/AuthContext";
import { TenantAuthProvider } from "@/context/TenantAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TenantProtectedRoute } from "@/components/TenantProtectedRoute";
import Login from "@/pages/Login";
import TenantLogin from "@/pages/TenantLogin";
import TenantDashboard from "@/pages/TenantDashboard";
import Dashboard from "@/pages/Dashboard";
import Buildings from "@/pages/Buildings";
import BuildingDetails from "@/pages/BuildingDetails";
import Reminders from "@/pages/Reminders";
import Expenses from "@/pages/Expenses";
import Reports from "@/pages/Reports";
import PreviousTenants from "@/pages/PreviousTenants";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <RentRoostProvider>
            <TenantAuthProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Admin Routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Tenant Routes */}
                <Route path="/tenant/login" element={<TenantLogin />} />
                <Route path="/tenant/dashboard" element={
                  <TenantProtectedRoute>
                    <TenantDashboard />
                  </TenantProtectedRoute>
                } />
                
                {/* Protected Admin Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/buildings" element={
                  <ProtectedRoute>
                    <Buildings />
                  </ProtectedRoute>
                } />
                <Route path="/buildings/:buildingId" element={
                  <ProtectedRoute>
                    <BuildingDetails />
                  </ProtectedRoute>
                } />
                <Route path="/reminders" element={
                  <ProtectedRoute>
                    <Reminders />
                  </ProtectedRoute>
                } />
                <Route path="/expenses" element={
                  <ProtectedRoute>
                    <Expenses />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } />
                <Route path="/previous-tenants" element={
                  <ProtectedRoute>
                    <PreviousTenants />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TenantAuthProvider>
          </RentRoostProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;