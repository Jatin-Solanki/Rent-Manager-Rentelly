import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Home, Phone, Calendar, Shield } from 'lucide-react';
import { useTenantAuth } from '@/context/TenantAuthContext';

const TenantLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  
  // Add error boundary for context
  let tenantLogin, currentTenant, loading;
  try {
    const auth = useTenantAuth();
    tenantLogin = auth.tenantLogin;
    currentTenant = auth.currentTenant;
    loading = auth.loading;
  } catch (error) {
    console.error('TenantAuth context error:', error);
    // Fallback values
    tenantLogin = async () => false;
    currentTenant = null;
    loading = false;
  }
  const navigate = useNavigate();

  // Redirect if already logged in
  if (currentTenant) {
    return <Navigate to="/tenant/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim() || !dob.trim()) {
      return;
    }

    const success = await tenantLogin(phoneNumber.trim(), dob.trim());
    if (success) {
      navigate('/tenant/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Home className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Tenant Portal</CardTitle>
          <CardDescription>
            Access your rental information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="text"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dob">Password</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dob"
                  type="text"
                  placeholder="Enter Password"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
              {/* <p className="text-xs text-muted-foreground">
                Use the format: DD/MM/YYYY (e.g., 15/08/1990)
              </p> */}
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-6 border-t pt-6">
            <div className="text-center mb-3">
              <p className="text-sm text-muted-foreground">
                Switch login type
              </p>
            </div>
            <Button 
              variant="outline" 
              className="w-full mb-4" 
              onClick={() => navigate('/login')}
              type="button"
            >
              <Shield className="mr-2 h-4 w-4" />
              Login as Admin
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Having trouble accessing your account?
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please contact your property manager for assistance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantLogin;