import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { BarChart3, Calendar, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRentRoost } from "@/context/RentRoostContext";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, subMonths, parse } from "date-fns";
import { Label } from "@/components/ui/label";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ensureDate } from "@/lib/firebase";

const Reports = () => {
  const { buildings, expenses, getTotalsByDateRange } = useRentRoost();
  const { currentUser } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: subMonths(new Date(), 1),
    endDate: new Date(),
  });
  const [reportData, setReportData] = useState({
    totalRent: 0,
    totalElectricity: 0,
    totalExpense: 0,
    chartData: [],
    propertyReports: [],
    detailedPaymentReports: []
  });

  useEffect(() => {
    if (!currentUser) return;
    
    console.log("Generating report data for date range:", 
      format(dateRange.startDate, "yyyy-MM-dd"), "to", 
      format(dateRange.endDate, "yyyy-MM-dd"));
    
    const fromContextTotals = getTotalsByDateRange(
      dateRange.startDate,
      dateRange.endDate
    );
    
    const userBuildings = buildings.filter(b => b.ownerId === currentUser.uid);
    
    const chartData = userBuildings.map(building => {
      const occupiedUnitsCount = building.units.filter(unit => unit.tenant !== null).length;
      const occupancyRate = Math.round((occupiedUnitsCount / building.unitsCount) * 100);
      
      let totalPayments = 0;
      const unitPayments = [];

      building.units.forEach(unit => {
        // Process current tenant
        if (unit.tenant) {
          const rentPayments = (unit.tenant.rentPayments || [])
            .filter(payment => {
              const paymentYear = payment.year.toString();
              const paymentMonth = payment.month;
              const startYear = dateRange.startDate.getFullYear();
              const startMonth = format(dateRange.startDate, "MMMM");
              const endYear = dateRange.endDate.getFullYear();
              const endMonth = format(dateRange.endDate, "MMMM");
              
              const paymentDate = parse(`${paymentMonth} ${paymentYear}`, "MMMM yyyy", new Date());
              const startDate = parse(`${startMonth} ${startYear}`, "MMMM yyyy", new Date());
              const endDate = parse(`${endMonth} ${endYear}`, "MMMM yyyy", new Date());
              
              return paymentDate >= startDate && paymentDate <= endDate;
            });

          const totalPaid = rentPayments.reduce((sum, payment) => sum + payment.amount, 0);
          totalPayments += totalPaid;

          rentPayments.forEach(payment => {
            unitPayments.push({
              buildingName: building.name,
              unitName: unit.name,
              tenantName: unit.tenant.name,
              amount: payment.amount,
              paymentMethod: payment.paymentMethod
            });
          });
        }

        // Process previous tenants
        if (unit.previousTenants) {
          unit.previousTenants.forEach(prevTenant => {
            const rentPayments = (prevTenant.rentPayments || [])
              .filter(payment => {
                const paymentYear = payment.year.toString();
                const paymentMonth = payment.month;
                const startYear = dateRange.startDate.getFullYear();
                const startMonth = format(dateRange.startDate, "MMMM");
                const endYear = dateRange.endDate.getFullYear();
                const endMonth = format(dateRange.endDate, "MMMM");
                
                const paymentDate = parse(`${paymentMonth} ${paymentYear}`, "MMMM yyyy", new Date());
                const startDate = parse(`${startMonth} ${startYear}`, "MMMM yyyy", new Date());
                const endDate = parse(`${endMonth} ${endYear}`, "MMMM yyyy", new Date());
                
                return paymentDate >= startDate && paymentDate <= endDate;
              });

            const totalPaid = rentPayments.reduce((sum, payment) => sum + payment.amount, 0);
            totalPayments += totalPaid;

            rentPayments.forEach(payment => {
              unitPayments.push({
                buildingName: building.name,
                unitName: unit.name,
                tenantName: `${prevTenant.name} (Previous)`,
                amount: payment.amount,
                paymentMethod: payment.paymentMethod
              });
            });
          });
        }
      });

      const buildingElectricity = building.units.reduce((total, unit) => {
        let unitTotal = 0;
        
        // Process current tenant
        if (unit.tenant) {
          unitTotal += (unit.tenant.electricityRecords || [])
            .filter(record => {
              try {
                const recordDate = ensureDate(record.date);
                return recordDate >= dateRange.startDate && 
                  recordDate <= dateRange.endDate;
              } catch (error) {
                console.error("Error processing electricity record date:", error);
                return false;
              }
            })
            .reduce((sum, record) => sum + record.amount, 0);
        }
        
        // Process previous tenants
        if (unit.previousTenants) {
          unit.previousTenants.forEach(prevTenant => {
            unitTotal += (prevTenant.electricityRecords || [])
              .filter(record => {
                try {
                  const recordDate = ensureDate(record.date);
                  return recordDate >= dateRange.startDate && 
                    recordDate <= dateRange.endDate;
                } catch (error) {
                  console.error("Error processing electricity record date:", error);
                  return false;
                }
              })
              .reduce((sum, record) => sum + record.amount, 0);
          });
        }
        
        return total + unitTotal;
      }, 0);

      const buildingExpenses = (expenses || [])
        .filter(expense => {
          try {
            return expense.buildingId === building.id &&
              ensureDate(expense.date) >= dateRange.startDate && 
              ensureDate(expense.date) <= dateRange.endDate;
          } catch (error) {
            console.error("Error processing expense date:", error);
            return false;
          }
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        name: building.name,
        occupancy: occupancyRate,
        rent: totalPayments,
        electricity: buildingElectricity,
      };
    });

    const propertyReports = userBuildings.map(building => {
      const occupiedUnitsCount = building.units.filter(unit => unit.tenant !== null).length;
      const occupancyRate = Math.round((occupiedUnitsCount / building.unitsCount) * 100);
      
      let totalPayments = 0;
      const unitPayments = [];

      building.units.forEach(unit => {
        // Process current tenant
        if (unit.tenant) {
          const rentPayments = (unit.tenant.rentPayments || [])
            .filter(payment => {
              const paymentYear = payment.year.toString();
              const paymentMonth = payment.month;
              const startYear = dateRange.startDate.getFullYear();
              const startMonth = format(dateRange.startDate, "MMMM");
              const endYear = dateRange.endDate.getFullYear();
              const endMonth = format(dateRange.endDate, "MMMM");
              
              const paymentDate = parse(`${paymentMonth} ${paymentYear}`, "MMMM yyyy", new Date());
              const startDate = parse(`${startMonth} ${startYear}`, "MMMM yyyy", new Date());
              const endDate = parse(`${endMonth} ${endYear}`, "MMMM yyyy", new Date());
              
              return paymentDate >= startDate && paymentDate <= endDate;
            });

          const totalPaid = rentPayments.reduce((sum, payment) => sum + payment.amount, 0);
          totalPayments += totalPaid;

          rentPayments.forEach(payment => {
            unitPayments.push({
              buildingName: building.name,
              unitName: unit.name,
              tenantName: unit.tenant.name,
              amount: payment.amount,
              paymentMethod: payment.paymentMethod
            });
          });
        }

        // Process previous tenants
        if (unit.previousTenants) {
          unit.previousTenants.forEach(prevTenant => {
            const rentPayments = (prevTenant.rentPayments || [])
              .filter(payment => {
                const paymentYear = payment.year.toString();
                const paymentMonth = payment.month;
                const startYear = dateRange.startDate.getFullYear();
                const startMonth = format(dateRange.startDate, "MMMM");
                const endYear = dateRange.endDate.getFullYear();
                const endMonth = format(dateRange.endDate, "MMMM");
                
                const paymentDate = parse(`${paymentMonth} ${paymentYear}`, "MMMM yyyy", new Date());
                const startDate = parse(`${startMonth} ${startYear}`, "MMMM yyyy", new Date());
                const endDate = parse(`${endMonth} ${endYear}`, "MMMM yyyy", new Date());
                
                return paymentDate >= startDate && paymentDate <= endDate;
              });

            const totalPaid = rentPayments.reduce((sum, payment) => sum + payment.amount, 0);
            totalPayments += totalPaid;

            rentPayments.forEach(payment => {
              unitPayments.push({
                buildingName: building.name,
                unitName: unit.name,
                tenantName: `${prevTenant.name} (Previous)`,
                amount: payment.amount,
                paymentMethod: payment.paymentMethod
              });
            });
          });
        }
      });

      const buildingElectricity = building.units.reduce((total, unit) => {
        let unitTotal = 0;
        
        // Process current tenant
        if (unit.tenant) {
          unitTotal += (unit.tenant.electricityRecords || [])
            .filter(record => {
              try {
                const recordDate = ensureDate(record.date);
                return recordDate >= dateRange.startDate && 
                  recordDate <= dateRange.endDate;
              } catch (error) {
                console.error("Error processing electricity record date:", error);
                return false;
              }
            })
            .reduce((sum, record) => sum + record.amount, 0);
        }
        
        // Process previous tenants
        if (unit.previousTenants) {
          unit.previousTenants.forEach(prevTenant => {
            unitTotal += (prevTenant.electricityRecords || [])
              .filter(record => {
                try {
                  const recordDate = ensureDate(record.date);
                  return recordDate >= dateRange.startDate && 
                    recordDate <= dateRange.endDate;
                } catch (error) {
                  console.error("Error processing electricity record date:", error);
                  return false;
                }
              })
              .reduce((sum, record) => sum + record.amount, 0);
          });
        }
        
        return total + unitTotal;
      }, 0);

      const buildingExpenses = (expenses || [])
        .filter(expense => {
          try {
            return expense.buildingId === building.id &&
              ensureDate(expense.date) >= dateRange.startDate && 
              ensureDate(expense.date) <= dateRange.endDate;
          } catch (error) {
            console.error("Error processing expense date:", error);
            return false;
          }
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        id: building.id,
        name: building.name,
        units: building.unitsCount,
        occupied: occupiedUnitsCount,
        occupancyRate,
        rent: totalPayments,
        electricity: buildingElectricity,
        expenses: buildingExpenses,
        income: (totalPayments + buildingElectricity - buildingExpenses),
      };
    });

    const calculatedTotalRent = propertyReports.reduce((sum, report) => sum + report.rent, 0);
    const calculatedTotalElectricity = propertyReports.reduce((sum, report) => sum + report.electricity, 0);
    const calculatedTotalExpense = propertyReports.reduce((sum, report) => sum + report.expenses, 0);
    
    const detailedPayments = userBuildings.flatMap(building =>
      building.units.flatMap(unit => {
        const payments = [];
        
        // Process current tenant payments
        if (unit.tenant) {
          const currentTenantPayments = (unit.tenant.rentPayments || [])
            .filter(payment => {
              const paymentYear = payment.year.toString();
              const paymentMonth = payment.month;
              const startYear = dateRange.startDate.getFullYear();
              const startMonth = format(dateRange.startDate, "MMMM");
              const endYear = dateRange.endDate.getFullYear();
              const endMonth = format(dateRange.endDate, "MMMM");
              
              const paymentDate = parse(`${paymentMonth} ${paymentYear}`, "MMMM yyyy", new Date());
              const startDate = parse(`${startMonth} ${startYear}`, "MMMM yyyy", new Date());
              const endDate = parse(`${endMonth} ${endYear}`, "MMMM yyyy", new Date());
              
              return paymentDate >= startDate && paymentDate <= endDate;
            })
            .map(payment => ({
              buildingName: building.name,
              unitName: unit.name,
              tenantName: unit.tenant.name,
              amount: payment.amount,
              paymentMethod: payment.paymentMethod,
              month: `${payment.month} ${payment.year}`
            }));
          
          payments.push(...currentTenantPayments);
        }
        
        // Process previous tenant payments
        if (unit.previousTenants) {
          unit.previousTenants.forEach(prevTenant => {
            const prevTenantPayments = (prevTenant.rentPayments || [])
              .filter(payment => {
                const paymentYear = payment.year.toString();
                const paymentMonth = payment.month;
                const startYear = dateRange.startDate.getFullYear();
                const startMonth = format(dateRange.startDate, "MMMM");
                const endYear = dateRange.endDate.getFullYear();
                const endMonth = format(dateRange.endDate, "MMMM");
                
                const paymentDate = parse(`${paymentMonth} ${paymentYear}`, "MMMM yyyy", new Date());
                const startDate = parse(`${startMonth} ${startYear}`, "MMMM yyyy", new Date());
                const endDate = parse(`${endMonth} ${endYear}`, "MMMM yyyy", new Date());
                
                return paymentDate >= startDate && paymentDate <= endDate;
              })
              .map(payment => ({
                buildingName: building.name,
                unitName: unit.name,
                tenantName: `${prevTenant.name} (Previous)`,
                amount: payment.amount,
                paymentMethod: payment.paymentMethod,
                month: `${payment.month} ${payment.year}`
              }));
            
            payments.push(...prevTenantPayments);
          });
        }
        
        return payments;
      })
    );

    setReportData({
      totalRent: calculatedTotalRent,
      totalElectricity: calculatedTotalElectricity, 
      totalExpense: calculatedTotalExpense,
      chartData,
      propertyReports,
      detailedPaymentReports: detailedPayments
    });
    
    console.log("Report data generated:", {
      totalRent: calculatedTotalRent, 
      totalElectricity: calculatedTotalElectricity, 
      totalExpense: calculatedTotalExpense,
      chartData: chartData.length,
      propertyReports: propertyReports.length
    });
    
  }, [buildings, expenses, dateRange, currentUser, getTotalsByDateRange]);

  const totalUnits = buildings.reduce((acc, building) => acc + building.unitsCount, 0);
  const occupiedUnits = buildings.reduce(
    (acc, building) => acc + building.units.filter(unit => unit.tenant !== null).length,
    0
  );
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const handleDownload = () => {
    toast.success("Report downloaded successfully");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout title="Reports">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-rentroost-dark">Financial Reports</h2>
            <p className="text-gray-500">
              View and generate reports for your properties
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-lg">Select Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !dateRange.startDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.startDate ? format(dateRange.startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.startDate}
                      onSelect={(date) => date && setDateRange({ ...dateRange, startDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !dateRange.endDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.endDate ? format(dateRange.endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.endDate}
                      onSelect={(date) => date && setDateRange({ ...dateRange, endDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center p-4 bg-gray-50 rounded-lg border print:hidden">
          <h3 className="text-lg font-medium mb-2">
            Report for: {format(dateRange.startDate, "MMM d, yyyy")} — {format(dateRange.endDate, "MMM d, yyyy")}
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Rent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{reportData.totalRent.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Electricity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{reportData.totalElectricity.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{reportData.totalExpense.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(reportData.totalRent + reportData.totalElectricity - reportData.totalExpense).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold">Income Analysis</h3>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue by Property</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {reportData.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rent" name="Rent" fill="#0d9488" />
                    <Bar dataKey="electricity" name="Electricity" fill="#eab308" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Occupancy by Property</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {reportData.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="occupancy" name="Occupancy (%)" fill="#1e40af" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold">Property-wise Report</h3>
          
          {reportData.propertyReports.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead className="text-right">Total Rent</TableHead>
                    <TableHead className="text-right">Electricity</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Net Income</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.propertyReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>{report.occupied}/{report.units}</TableCell>
                      <TableCell>{report.occupancyRate}%</TableCell>
                      <TableCell className="text-right">₹{report.rent.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{report.electricity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{report.expenses.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">₹{report.income.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rentroost-accent mb-4">
                <BarChart3 className="h-6 w-6 text-rentroost-primary" />
              </div>
              <h4 className="text-lg font-medium mb-2">No Properties Added</h4>
              <p className="text-gray-500 max-w-md mx-auto">
                Add properties to generate detailed reports.
              </p>
            </div>
          )}

          <h3 className="text-xl font-bold mt-8">Payment Details</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Tenant Name</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Month</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.detailedPaymentReports.map((detail, index) => (
                  <TableRow key={`${detail.buildingName}-${detail.unitName}-${index}`}>
                    <TableCell className="font-medium">{detail.buildingName}</TableCell>
                    <TableCell>{detail.unitName}</TableCell>
                    <TableCell>{detail.tenantName}</TableCell>
                    <TableCell className="text-right">₹{detail.amount.toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{detail.paymentMethod}</TableCell>
                    <TableCell>{detail.month}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;