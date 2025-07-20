import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Building, Tenant } from '@/context/RentRoostContext';
import { subscribeToAllBuildings } from '@/lib/firebaseUtils';

interface TenantAuthContextType {
  currentTenant: Tenant | null;
  tenantBuildingData: {
    building: Building;
    unit: {id: string; name: string; floor?: string; details?: string};
  } | null;
  loading: boolean;
  tenantLogin: (phoneNumber: string, dob: string) => Promise<boolean>;
  tenantLogout: () => void;
}

const TenantAuthContext = createContext<TenantAuthContextType | undefined>(undefined);

export function useTenantAuth() {
  const context = useContext(TenantAuthContext);
  if (context === undefined) {
    console.error('useTenantAuth called outside of TenantAuthProvider');
    throw new Error('useTenantAuth must be used within a TenantAuthProvider');
  }
  return context;
}

export function TenantAuthProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenantBuildingData, setTenantBuildingData] = useState<{
    building: Building;
    unit: {id: string; name: string; floor?: string; details?: string};
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check for stored tenant session on mount
  useEffect(() => {
    const storedTenantId = localStorage.getItem('tenantId');
    if (storedTenantId) {
      // Re-authenticate tenant by finding them in the buildings
      setLoading(true);
      const unsubscribe = subscribeToAllBuildings((buildings) => {
        let foundTenant: Tenant | null = null;
        let foundBuildingData: typeof tenantBuildingData = null;

        for (const building of buildings) {
          for (const unit of building.units) {
            if (unit.tenant && unit.tenant.id === storedTenantId) {
              foundTenant = unit.tenant;
              foundBuildingData = {
                building,
                unit: {
                  id: unit.id,
                  name: unit.name,
                  floor: unit.floor,
                  details: unit.details
                }
              };
              break;
            }
          }
          if (foundTenant) break;
        }

        if (foundTenant && foundBuildingData) {
          setCurrentTenant(foundTenant);
          setTenantBuildingData(foundBuildingData);
        } else {
          // Tenant not found, clear stored session
          localStorage.removeItem('tenantId');
        }
        setLoading(false);
      });

      return unsubscribe;
    }
  }, []);

  async function tenantLogin(phoneNumber: string, dob: string): Promise<boolean> {
    setLoading(true);
    
    try {
      console.log("Tenant login attempt:", { phoneNumber, dob });
      
      return new Promise((resolve) => {
        const unsubscribe = subscribeToAllBuildings((buildings) => {
          console.log("Searching in buildings:", buildings.length);
          let foundTenant: Tenant | null = null;
          let foundBuildingData: typeof tenantBuildingData = null;

          // Search for tenant with matching phone number and DOB
          for (const building of buildings) {
            for (const unit of building.units) {
              if (unit.tenant && 
                  unit.tenant.contactNo === phoneNumber && 
                  unit.tenant.active) {
                console.log("Found tenant with matching phone:", {
                  tenantName: unit.tenant.name,
                  storedDOB: unit.tenant.dateOfBirth,
                  inputDOB: dob
                });
                
                // Check if DOB matches the stored DOB
                const tenantDOB = formatDOBForComparison(dob);
                const storedDOB = formatDOBForComparison(unit.tenant.dateOfBirth || '');
                
                console.log("DOB comparison:", { tenantDOB, storedDOB, match: storedDOB === tenantDOB });
                
                if (storedDOB === tenantDOB) {
                  foundTenant = unit.tenant;
                  foundBuildingData = {
                    building,
                    unit: {
                      id: unit.id,
                      name: unit.name,
                      floor: unit.floor,
                      details: unit.details
                    }
                  };
                  break;
                }
              }
            }
            if (foundTenant) break;
          }

          if (foundTenant && foundBuildingData) {
            setCurrentTenant(foundTenant);
            setTenantBuildingData(foundBuildingData);
            localStorage.setItem('tenantId', foundTenant.id);
            
            toast({
              title: "Login successful",
              description: `Welcome ${foundTenant.name}!`,
            });
            
            setLoading(false);
            if (unsubscribe) unsubscribe();
            resolve(true);
          } else {
            toast({
              variant: "destructive",
              title: "Login failed",
              description: "Invalid phone number or date of birth.",
            });
            
            setLoading(false);
            if (unsubscribe) unsubscribe();
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error("Tenant login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An error occurred during login.",
      });
      setLoading(false);
      return false;
    }
  }

  function tenantLogout() {
    setCurrentTenant(null);
    setTenantBuildingData(null);
    localStorage.removeItem('tenantId');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  }

  // Helper function to format DOB consistently
  function formatDOBForComparison(dob: string): string {
    // Remove any non-alphanumeric characters and convert to lowercase
    return dob.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  const value = {
    currentTenant,
    tenantBuildingData,
    loading,
    tenantLogin,
    tenantLogout,
  };

  return (
    <TenantAuthContext.Provider value={value}>
      {children}
    </TenantAuthContext.Provider>
  );
}