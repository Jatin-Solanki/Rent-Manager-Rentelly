import { Navigate, useLocation } from 'react-router-dom';
import { useTenantAuth } from '@/context/TenantAuthContext';
import { Loader2 } from 'lucide-react';

export const TenantProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentTenant, loading } = useTenantAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading tenant authentication...</span>
      </div>
    );
  }

  if (!currentTenant) {
    // Redirect to tenant login page but save the current location they were trying to access
    return <Navigate to="/tenant/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};