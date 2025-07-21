import React from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LogOut, 
  User, 
  Phone, 
  Home, 
  Users, 
  DollarSign,
  Calendar,
  FileText,
  Download,
  Zap
} from 'lucide-react';
import { useTenantAuth } from '@/context/TenantAuthContext';
import { format } from 'date-fns';

const TenantDashboard = () => {
  const { currentTenant, tenantBuildingData, tenantLogout } = useTenantAuth();

  // Redirect if not logged in
  if (!currentTenant || !tenantBuildingData) {
    return <Navigate to="/tenant/login" replace />;
  }

  const { building, unit } = tenantBuildingData;
  const tenant = currentTenant;

  const handleDocumentView = (docUrl: string, docType: string) => {
    if (docUrl) {
      window.open(docUrl, '_blank');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    
    try {
      let dateObj;
      
      // Handle Firestore timestamp
      if (date && typeof date === 'object' && date.toDate) {
        dateObj = date.toDate();
      }
      // Handle Firestore timestamp with seconds
      else if (date && typeof date === 'object' && date.seconds) {
        dateObj = new Date(date.seconds * 1000);
      }
      // Handle regular date strings/objects
      else {
        dateObj = new Date(date);
      }
      
      if (isNaN(dateObj.getTime())) {
        console.log('Invalid date value:', date);
        return 'N/A';
      }
      
      return format(dateObj, 'dd MMM yyyy');
    } catch (error) {
      console.error('Date formatting error:', error, 'Original date:', date);
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Tenant Portal</h1>
              <p className="text-sm text-muted-foreground">Welcome, {tenant.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={tenantLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Property Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Property Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Building</Label>
                <p className="text-lg font-semibold">{building.name}</p>
                {building.address && (
                  <p className="text-sm text-muted-foreground">{building.address}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Unit</Label>
                <p className="text-lg font-semibold">{unit.name}</p>
                {unit.floor && (
                  <p className="text-sm text-muted-foreground">Floor: {unit.floor}</p>
                )}
              </div>
            </div>
            {unit.details && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Unit Details</Label>
                <p className="text-sm">{unit.details}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                <p className="font-semibold">{tenant.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Contact Number</Label>
                <p className="font-semibold">{tenant.contactNo}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Family Members</Label>
                <p className="font-semibold">{tenant.memberCount}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Monthly Rent</Label>
                <p className="text-lg font-bold text-primary">{formatCurrency(tenant.rentAmount)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Move-in Date</Label>
                <p className="font-semibold">
                  {formatDate(tenant.moveInDate)}
                </p>
              </div>
            </div>
            {tenant.about && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Additional Information</Label>
                <p className="text-sm">{tenant.about}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Documents</span>
            </CardTitle>
            <CardDescription>
              Your uploaded documents (read-only access)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenant.idProof && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">ID Proof</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDocumentView(tenant.idProof as string, 'ID Proof')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            )}
            {tenant.policeVerification && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Police Verification</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDocumentView(tenant.policeVerification as string, 'Police Verification')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            )}
            {tenant.otherDocuments && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Other Documents</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDocumentView(tenant.otherDocuments as string, 'Other Documents')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            )}
            {!tenant.idProof && !tenant.policeVerification && !tenant.otherDocuments && (
              <p className="text-muted-foreground text-center py-4">No documents uploaded</p>
            )}
          </CardContent>
        </Card>

        {/* Rent Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Rent Payment History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenant.rentPayments && tenant.rentPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Month/Year</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenant.rentPayments
                    .sort((a, b) => {
                      const getDateValue = (date: any) => {
                        if (!date) return 0;
                        if (date && typeof date === 'object' && date.toDate) return date.toDate().getTime();
                        if (date && typeof date === 'object' && date.seconds) return date.seconds * 1000;
                        return new Date(date).getTime();
                      };
                      return getDateValue(b.date) - getDateValue(a.date);
                    })
                    .map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>{payment.month} {payment.year}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{payment.paymentMethod || 'N/A'}</TableCell>
                      <TableCell>{payment.remarks || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No rent payments recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Electricity Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Electricity Usage History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenant.electricityRecords && tenant.electricityRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Previous Reading</TableHead>
                    <TableHead>Current Reading</TableHead>
                    <TableHead>Units Consumed</TableHead>
                    <TableHead>Rate per Unit</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenant.electricityRecords
                    .sort((a, b) => {
                      const getDateValue = (date: any) => {
                        if (!date) return 0;
                        if (date && typeof date === 'object' && date.toDate) return date.toDate().getTime();
                        if (date && typeof date === 'object' && date.seconds) return date.seconds * 1000;
                        return new Date(date).getTime();
                      };
                      return getDateValue(b.date) - getDateValue(a.date);
                    })
                    .map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>{record.previousReading}</TableCell>
                      <TableCell>{record.currentReading}</TableCell>
                      <TableCell>{record.unitsConsumed}</TableCell>
                      <TableCell>₹{record.ratePerUnit}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(record.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No electricity records found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper Label component since it's used but not imported
const Label = ({ className, children, ...props }: { className?: string; children: React.ReactNode }) => (
  <label className={className} {...props}>{children}</label>
);

export default TenantDashboard;