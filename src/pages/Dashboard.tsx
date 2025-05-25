
import { Layout } from "@/components/layout/Layout";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRentRoost } from "@/context/RentRoostContext";
import { Building, DollarSign, BadgeDollarSign, Lightbulb, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth } from "date-fns";
import { ensureDate } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { 
    buildings, 
    expenses, 
    previousTenants,
    reminders,
    getTotalsByDateRange
  } = useRentRoost();
  const navigate = useNavigate();
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const buildingsPerPage = 3;
  const [remindersPage, setRemindersPage] = useState(1);
  const remindersPerPage = 3;
  const [tenantsPage, setTenantsPage] = useState(1);
  const tenantsPerPage = 3;
  
  const today = new Date();
  const startOfCurrentMonth = startOfMonth(today);
  const { totalRent, totalElectricity, totalExpense } = getTotalsByDateRange(
    startOfCurrentMonth,
    today
  );

  const overallRent = buildings.reduce((total, building) => {
    return total + building.units.reduce((unitTotal, unit) => {
      return unitTotal + (unit.tenant?.rentAmount || 0);
    }, 0);
  }, 0);

  // Calculate paginated building data
  const paginatedBuildings = buildings
    .map(building => {
      const expectedRent = building.units.reduce((total, unit) => {
        return total + (unit.tenant?.rentAmount || 0);
      }, 0);

      const receivedRent = building.units.reduce((total, unit) => {
        if (!unit.tenant) return total;
        return total + (unit.tenant.rentPayments || [])
          .filter(payment => {
            const paymentDate = ensureDate(payment.date);
            return (
              paymentDate >= startOfCurrentMonth && 
              paymentDate <= today
            );
          })
          .reduce((sum, payment) => sum + payment.amount, 0);
      }, 0);

      const unpaidUnits = building.units
        .filter(unit => {
          if (!unit.tenant) return false;
          const rentPaid = (unit.tenant.rentPayments || [])
            .filter(payment => {
              const paymentDate = ensureDate(payment.date);
              return (
                paymentDate >= startOfCurrentMonth && 
                paymentDate <= today
              );
            })
            .reduce((sum, payment) => sum + payment.amount, 0);
          return rentPaid < unit.tenant.rentAmount;
        })
        .map(unit => ({
          unitName: unit.name,
          tenantName: unit.tenant?.name || '',
          rentAmount: unit.tenant?.rentAmount || 0,
          rentPaid: (unit.tenant?.rentPayments || [])
            .filter(payment => {
              const paymentDate = ensureDate(payment.date);
              return (
                paymentDate >= startOfCurrentMonth && 
                paymentDate <= today
              );
            })
            .reduce((sum, payment) => sum + payment.amount, 0)
        }));

      return {
        ...building,
        expectedRent,
        receivedRent,
        unpaidUnits
      };
    });
  
  // Get current items for pagination
  const indexOfLastBuilding = currentPage * buildingsPerPage;
  const indexOfFirstBuilding = indexOfLastBuilding - buildingsPerPage;
  const currentBuildings = paginatedBuildings.slice(indexOfFirstBuilding, indexOfLastBuilding);
  
  // Calculate total pages
  const totalBuildingPages = Math.ceil(paginatedBuildings.length / buildingsPerPage);

  // Paginate reminders
  const pendingReminders = reminders
    .filter(r => !r.completed)
    .map(r => ({
      ...r,
      date: ensureDate(r.date)
    }));
    
  const indexOfLastReminder = remindersPage * remindersPerPage;
  const indexOfFirstReminder = indexOfLastReminder - remindersPerPage;
  const currentReminders = pendingReminders.slice(indexOfFirstReminder, indexOfLastReminder);
  const totalReminderPages = Math.ceil(pendingReminders.length / remindersPerPage);
  
  // Paginate previous tenants
  const sortedPreviousTenants = [...previousTenants]
    .sort((a, b) => {
      const dateA = a.moveOutDate ? new Date(a.moveOutDate).getTime() : 0;
      const dateB = b.moveOutDate ? new Date(b.moveOutDate).getTime() : 0;
      return dateB - dateA;
    });
    
  const indexOfLastTenant = tenantsPage * tenantsPerPage;
  const indexOfFirstTenant = indexOfLastTenant - tenantsPerPage;
  const currentTenants = sortedPreviousTenants.slice(indexOfFirstTenant, indexOfLastTenant);
  const totalTenantPages = Math.ceil(sortedPreviousTenants.length / tenantsPerPage);

  return (
    <Layout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-rentroost-dark">Overview</h2>
          <Button onClick={() => navigate("/buildings")}>
            <Building className="h-4 w-4 mr-2" />
            Manage Properties
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Rent (This Month)"
            value={`₹${totalRent}`}
            icon={DollarSign}
            description={`As of ${format(today, "MMM d, yyyy")}`}
            iconClassName="bg-green-100 text-green-600"
          />
          <StatsCard
            title="Overall Monthly Rent"
            value={`₹${overallRent}`}
            icon={DollarSign}
            description="Sum of all unit rents"
            iconClassName="bg-green-100 text-green-600"
          />
          <StatsCard
            title="Total Electricity (This Month)"
            value={`₹${totalElectricity}`}
            icon={BadgeDollarSign}
            description={`As of ${format(today, "MMM d, yyyy")}`}
            iconClassName="bg-blue-100 text-blue-600"
          />
          <StatsCard
            title="Total Expenses (This Month)"
            value={`₹${totalExpense}`}
            icon={BadgeDollarSign}
            description={`As of ${format(today, "MMM d, yyyy")}`}
            iconClassName="bg-red-100 text-red-600"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>
                  Your recent property management activities
                </CardDescription>
              </div>
              {buildings.length > buildingsPerPage && (
                <div className="text-sm text-gray-500">
                  Showing {indexOfFirstBuilding + 1}-{Math.min(indexOfLastBuilding, buildings.length)} of {buildings.length}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {currentBuildings.length > 0 ? (
                    currentBuildings.map((building) => (
                      <div 
                        key={building.id} 
                        className="flex items-center justify-between p-2 rounded bg-rentroost-accent cursor-pointer hover:bg-rentroost-accent/80 transition-colors"
                        onClick={() => setSelectedBuilding(building.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-full text-rentroost-primary">
                            <Building className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium">{building.name}</h4>
                            <p className="text-sm text-gray-500">{building.unitsCount} units</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{building.receivedRent.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">/ ₹{building.expectedRent.toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No properties added yet</p>
                      <Button 
                        className="mt-2" 
                        variant="outline"
                        onClick={() => navigate("/buildings")}
                      >
                        Add Property
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {buildings.length > 0 && totalBuildingPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} />
                      </PaginationItem>
                    )}
                    
                    {Array.from({ length: Math.min(3, totalBuildingPages) }).map((_, i) => {
                      const pageToShow = currentPage === 1 ? i + 1 : 
                                         currentPage === totalBuildingPages ? totalBuildingPages - 2 + i : 
                                         currentPage - 1 + i;
                      
                      if (pageToShow > 0 && pageToShow <= totalBuildingPages) {
                        return (
                          <PaginationItem key={pageToShow}>
                            <PaginationLink 
                              isActive={currentPage === pageToShow} 
                              onClick={() => setCurrentPage(pageToShow)}
                            >
                              {pageToShow}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    {currentPage < totalBuildingPages && (
                      <PaginationItem>
                        <PaginationNext onClick={() => setCurrentPage(prev => Math.min(totalBuildingPages, prev + 1))} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Reminders</CardTitle>
                <CardDescription>
                  Your upcoming reminders
                </CardDescription>
              </div>
              {pendingReminders.length > remindersPerPage && (
                <div className="text-sm text-gray-500">
                  Showing {indexOfFirstReminder + 1}-{Math.min(indexOfLastReminder, pendingReminders.length)} of {pendingReminders.length}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {currentReminders.length > 0 ? (
                    currentReminders.map((reminder) => (
                      <div key={reminder.id} className="flex items-start gap-3 p-2 rounded bg-rentroost-accent">
                        <div className="p-2 bg-white rounded-full text-rentroost-primary mt-1">
                          <Lightbulb className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium">{reminder.title}</h4>
                          <p className="text-sm text-gray-500">{format(reminder.date, "MMM d, yyyy")}</p>
                          <p className="text-sm mt-1">{reminder.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No reminders added yet</p>
                      <Button 
                        className="mt-2" 
                        variant="outline"
                        onClick={() => navigate("/reminders")}
                      >
                        Add Reminder
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {pendingReminders.length > 0 && totalReminderPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    {remindersPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setRemindersPage(prev => Math.max(1, prev - 1))} />
                      </PaginationItem>
                    )}
                    
                    {Array.from({ length: Math.min(3, totalReminderPages) }).map((_, i) => {
                      const pageToShow = remindersPage === 1 ? i + 1 : 
                                         remindersPage === totalReminderPages ? totalReminderPages - 2 + i : 
                                         remindersPage - 1 + i;
                      
                      if (pageToShow > 0 && pageToShow <= totalReminderPages) {
                        return (
                          <PaginationItem key={pageToShow}>
                            <PaginationLink 
                              isActive={remindersPage === pageToShow} 
                              onClick={() => setRemindersPage(pageToShow)}
                            >
                              {pageToShow}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    {remindersPage < totalReminderPages && (
                      <PaginationItem>
                        <PaginationNext onClick={() => setRemindersPage(prev => Math.min(totalReminderPages, prev + 1))} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Previous Tenants</CardTitle>
              <CardDescription>
                Recently moved-out tenants
              </CardDescription>
            </div>
            {sortedPreviousTenants.length > tenantsPerPage && (
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstTenant + 1}-{Math.min(indexOfLastTenant, sortedPreviousTenants.length)} of {sortedPreviousTenants.length}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {currentTenants.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {currentTenants.map((tenant) => {
                    const moveOutDate = tenant.moveOutDate ? ensureDate(tenant.moveOutDate) : null;
                    
                    return (
                      <div key={tenant.id} className="flex items-start gap-3 p-3 rounded bg-rentroost-accent">
                        <div className="p-2 bg-white rounded-full text-rentroost-primary">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium">{tenant.name}</h4>
                          <p className="text-sm text-gray-500">{tenant.contactNo}</p>
                          {moveOutDate && (
                            <p className="text-xs mt-1">
                              Move out: {format(moveOutDate, "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No previous tenants recorded</p>
              </div>
            )}
            
            {totalTenantPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  {tenantsPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setTenantsPage(prev => Math.max(1, prev - 1))} />
                    </PaginationItem>
                  )}
                  
                  {Array.from({ length: Math.min(3, totalTenantPages) }).map((_, i) => {
                    const pageToShow = tenantsPage === 1 ? i + 1 : 
                                         tenantsPage === totalTenantPages ? totalTenantPages - 2 + i : 
                                         tenantsPage - 1 + i;
                      
                    if (pageToShow > 0 && pageToShow <= totalTenantPages) {
                      return (
                        <PaginationItem key={pageToShow}>
                          <PaginationLink 
                            isActive={tenantsPage === pageToShow} 
                            onClick={() => setTenantsPage(pageToShow)}
                          >
                            {pageToShow}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  {tenantsPage < totalTenantPages && (
                    <PaginationItem>
                      <PaginationNext onClick={() => setTenantsPage(prev => Math.min(totalTenantPages, prev + 1))} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedBuilding} onOpenChange={() => setSelectedBuilding(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] w-full mx-4">
            <DialogHeader>
              <DialogTitle>
                Unpaid Rent Details - {paginatedBuildings.find(b => b.id === selectedBuilding)?.name}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                {paginatedBuildings
                  .find(b => b.id === selectedBuilding)
                  ?.unpaidUnits.map((unit, index) => (
                    <div key={index} className="p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{unit.unitName}</h4>
                          <p className="text-sm text-gray-500">{unit.tenantName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Paid: ₹{unit.rentPaid.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">of ₹{unit.rentAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                {paginatedBuildings.find(b => b.id === selectedBuilding)?.unpaidUnits.length === 0 && (
                  <p className="text-center text-gray-500 py-4">All tenants have paid their rent for this month.</p>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Dashboard;
