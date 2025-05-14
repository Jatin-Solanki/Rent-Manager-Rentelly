import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Search, Users, User, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useRentRoost } from "@/context/RentRoostContext";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { fetchPreviousTenants } from "@/lib/firebaseUtils";

const PreviousTenants = () => {
  const { previousTenants, buildings } = useRentRoost();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("recent");

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const tenants = await fetchPreviousTenants();
        console.log("Directly fetched tenants on mount:", tenants);
      } catch (err) {
        console.error("Error fetching previous tenants on mount:", err);
      }
    };
    
    if (auth.currentUser) {
      loadInitialData();
    }
  }, []);

  useEffect(() => {
    console.log("PreviousTenants component rendered with tenant count:", previousTenants.length);
    console.log("Previous tenants data:", previousTenants);
    
    console.log("Current user:", auth.currentUser?.uid);
    console.log("Buildings count:", buildings.length);
    
    if (previousTenants.length === 0) {
      console.log("No previous tenants found. This could be because:");
      console.log("1. No tenants have been moved to previous tenants");
      console.log("2. There might be an issue with the fetch or subscription");
      console.log("3. There could be permission issues in Firestore");
    }
    
    return () => {
      console.log("PreviousTenants component unmounting");
    };
  }, [previousTenants, buildings]);

  const handleViewTenantHistory = (tenantId: string) => {
    console.log("Viewing tenant history for:", tenantId);
    setSelectedTenant(tenantId);
  };

  const sortAndFilterTenants = () => {
    console.log("Sorting and filtering tenants with search term:", searchTerm);
    console.log("Sorting by:", sortBy);
    
    if (!Array.isArray(previousTenants)) {
      console.error("previousTenants is not an array:", previousTenants);
      toast.error("Error loading tenants data");
      return [];
    }
    
    let filtered = previousTenants.filter(tenant =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contactNo.includes(searchTerm)
    );
    
    console.log("Filtered tenants count:", filtered.length);

    switch (sortBy) {
      case "recent":
        return filtered.sort((a, b) => {
          const dateA = a.moveOutDate instanceof Date ? a.moveOutDate.getTime() : 0;
          const dateB = b.moveOutDate instanceof Date ? b.moveOutDate.getTime() : 0;
          return dateB - dateA;
        });
      case "name-asc":
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return filtered.sort((a, b) => b.name.localeCompare(a.name));
      case "rent-high":
        return filtered.sort((a, b) => b.rentAmount - a.rentAmount);
      case "rent-low":
        return filtered.sort((a, b) => a.rentAmount - b.rentAmount);
      default:
        return filtered;
    }
  };

  const tenantList = sortAndFilterTenants();
  const tenant = selectedTenant 
    ? previousTenants.find(t => t.id === selectedTenant) 
    : null;
    
  console.log("Filtered tenant list:", tenantList.length);

  return (
    <Layout title="Previous Tenants">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-rentroost-dark">Previous Tenants</h2>
            <p className="text-gray-500">
              History of past tenants across all properties
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              defaultValue="recent"
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="rent-high">Rent (High-Low)</SelectItem>
                  <SelectItem value="rent-low">Rent (Low-High)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search by name or phone number..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {tenantList.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tenantList.map((tenant) => (
              <Card key={tenant.id}>
                <CardHeader className="bg-rentroost-accent p-4 flex flex-row justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full text-rentroost-primary shadow-sm">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">{tenant.name}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-3 w-3 mr-1" />
                        {tenant.contactNo}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-gray-100">
                    Previous
                  </Badge>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Rent Amount</p>
                      <p className="font-medium">₹{tenant.rentAmount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Members</p>
                      <p>{tenant.memberCount}</p>
                    </div>
                    {tenant.moveInDate && (
                      <div>
                        <p className="text-gray-500">Move In</p>
                        <p>{tenant.moveInDate instanceof Date ? 
                            format(tenant.moveInDate, "MMM d, yyyy") : 
                            format(new Date(tenant.moveInDate), "MMM d, yyyy")}</p>
                      </div>
                    )}
                    {tenant.moveOutDate && (
                      <div>
                        <p className="text-gray-500">Move Out</p>
                        <p>{tenant.moveOutDate instanceof Date ? 
                            format(tenant.moveOutDate, "MMM d, yyyy") : 
                            format(new Date(tenant.moveOutDate), "MMM d, yyyy")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleViewTenantHistory(tenant.id)}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rentroost-accent mb-4">
              <Users className="h-8 w-8 text-rentroost-primary" />
            </div>
            <h3 className="text-xl font-medium text-rentroost-dark mb-2">No Previous Tenants</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              When you move tenants to the previous tenants list, they will appear here.
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedTenant} onOpenChange={(open) => !open && setSelectedTenant(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {tenant && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {tenant.name}
                </DialogTitle>
                <DialogDescription>
                  {tenant.moveInDate && tenant.moveOutDate && (
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {tenant.moveInDate instanceof Date ? format(tenant.moveInDate, "MMM d, yyyy") : "Unknown"} — 
                        {tenant.moveOutDate instanceof Date ? format(tenant.moveOutDate, "MMM d, yyyy") : "Unknown"}
                      </span>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6">
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Label className="text-xs text-gray-500">Contact</Label>
                    <p className="font-medium">{tenant.contactNo}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Label className="text-xs text-gray-500">Rent Amount</Label>
                    <p className="font-medium">₹{tenant.rentAmount}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Label className="text-xs text-gray-500">Members</Label>
                    <p className="font-medium">{tenant.memberCount}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Label className="text-xs text-gray-500">Room Details</Label>
                    <p className="font-medium">{tenant.roomDetails || "N/A"}</p>
                  </div>
                </div>

                {tenant.idProof && (
                  <div>
                    <Label className="mb-2 block">ID Proof</Label>
                    <div className="border rounded-md p-2 flex flex-col items-center justify-center bg-gray-50">
                      {typeof tenant.idProof === 'string' ? (
                        <>
                          <div className="text-sm text-gray-500 mb-2">Document Preview</div>
                          {tenant.idProof.toLowerCase().endsWith('.pdf') ? (
                            <iframe 
                              src={tenant.idProof} 
                              className="w-full h-[200px] border rounded"
                              title="ID Proof Document"
                            />
                          ) : (
                            <img 
                              src={tenant.idProof} 
                              alt="ID Proof" 
                              className="max-w-full h-auto max-h-[200px] rounded"
                            />
                          )}
                          <Button 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => window.open(tenant.idProof as string, '_blank')}
                          >
                            View Full Document
                          </Button>
                        </>
                      ) : (
                        <p className="text-gray-500">Document not available</p>
                      )}
                    </div>
                  </div>
                )}

                {tenant.policeVerification && (
                  <div>
                    <Label className="mb-2 block">Police Verification</Label>
                    <div className="border rounded-md p-2 flex flex-col items-center justify-center bg-gray-50">
                      {typeof tenant.policeVerification === 'string' ? (
                        <>
                          <div className="text-sm text-gray-500 mb-2">Document Preview</div>
                          {tenant.policeVerification.toLowerCase().endsWith('.pdf') ? (
                            <iframe 
                              src={tenant.policeVerification} 
                              className="w-full h-[200px] border rounded"
                              title="Police Verification Document"
                            />
                          ) : (
                            <img 
                              src={tenant.policeVerification} 
                              alt="Police Verification" 
                              className="max-w-full h-auto max-h-[200px] rounded"
                            />
                          )}
                          <Button 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => window.open(tenant.policeVerification as string, '_blank')}
                          >
                            View Full Document
                          </Button>
                        </>
                      ) : (
                        <p className="text-gray-500">Document not available</p>
                      )}
                    </div>
                  </div>
                )}

                {tenant.about && (
                  <div>
                    <Label>About</Label>
                    <p className="mt-1 text-sm">{tenant.about}</p>
                  </div>
                )}

                {tenant.rentPayments && tenant.rentPayments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Rent Payment History</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tenant.rentPayments
                            .sort((a, b) => {
                              const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
                              const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
                              return dateB - dateA;
                            })
                            .map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>
                                  {payment.date instanceof Date ? 
                                    format(payment.date, "MMM d, yyyy") : 
                                    format(new Date(payment.date), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell>{payment.month}</TableCell>
                                <TableCell>{payment.year}</TableCell>
                                <TableCell>{payment.paymentMethod || "Cash"}</TableCell>
                                <TableCell className="text-right font-medium">
                                  ₹{payment.amount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {tenant.electricityRecords && tenant.electricityRecords.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Electricity Payment History</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Previous</TableHead>
                            <TableHead>Current</TableHead>
                            <TableHead>Units</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tenant.electricityRecords
                            .sort((a, b) => {
                              const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
                              const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
                              return dateB - dateA;
                            })
                            .map((record) => (
                              <TableRow key={record.id}>
                                <TableCell>
                                  {record.date instanceof Date ? 
                                    format(record.date, "MMM d, yyyy") : 
                                    format(new Date(record.date), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell>{record.previousReading}</TableCell>
                                <TableCell>{record.currentReading}</TableCell>
                                <TableCell>{record.unitsConsumed}</TableCell>
                                <TableCell>₹{record.ratePerUnit}</TableCell>
                                <TableCell className="text-right font-medium">
                                  ₹{record.amount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {tenant.moveInDate && tenant.moveOutDate && (
                  <div>
                    <Label>Tenancy Period</Label>
                    <p className="mt-1 text-sm">
                      From: {tenant.moveInDate instanceof Date ? 
                        format(tenant.moveInDate, "MMM d, yyyy") : 
                        format(new Date(tenant.moveInDate), "MMM d, yyyy")}
                      <br />
                      To: {tenant.moveOutDate instanceof Date ? 
                        format(tenant.moveOutDate, "MMM d, yyyy") : 
                        format(new Date(tenant.moveOutDate), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PreviousTenants;
