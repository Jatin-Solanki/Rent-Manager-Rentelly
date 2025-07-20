import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { BadgeDollarSign, Plus, Search, Filter, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRentRoost } from "@/context/RentRoostContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { fetchExpenses } from "@/lib/firebaseUtils";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { ensureDate } from "@/lib/firebase";
// import { EditExpenseDialog } from "../components/dialogs/EditExpenseDialog";
import { Expense } from "@/context/RentRoostContext";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Expenses = () => {
  const { expenses, addExpense, buildings, deleteExpense } = useRentRoost();
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    date: new Date(),
    amount: "",
    description: "",
    buildingId: "",
    unitId: "",
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (auth.currentUser) {
          console.log("Directly fetching expenses on mount");
          const expensesData = await fetchExpenses();
          console.log("Direct fetch expenses result:", expensesData.length, "expenses");
        }
      } catch (err) {
        console.error("Error fetching expenses on mount:", err);
      }
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    console.log("Current expenses in component:", expenses.length, "items");
    if (expenses.length > 0) {
      console.log("Sample expense:", expenses[0]);
    }
  }, [expenses]);

  const handleAddExpense = async () => {
    if (!formData.amount || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      await addExpense({
        date: formData.date,
        amount: Number(formData.amount),
        description: formData.description,
        buildingId: formData.buildingId || null,
        unitId: formData.unitId || null,
      });
      
      setFormData({
        date: new Date(),
        amount: "",
        description: "",
        buildingId: "",
        unitId: "",
      });
      
      setOpen(false);
      toast.success("Expense added successfully");
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditExpense(expense);
    setEditOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteExpense(expenseId);
      } catch (error) {
        console.error("Error deleting expense:", error);
      }
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    if (!currentUser) return false;
    if (!expense.description) return false;
    
    // Search filter
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    
    // Date range filter
    if (dateFrom || dateTo) {
      const expenseDate = ensureDate(expense.date);
      const fromDate = dateFrom ? new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate()) : null;
      const toDate = dateTo ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59) : null;
      
      if (fromDate && expenseDate < fromDate) return false;
      if (toDate && expenseDate > toDate) return false;
    }
    
    return true;
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pagination logic
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo]);

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Calculate total for filtered/date range expenses
  const filteredTotalExpenses = filteredExpenses.reduce((total, expense) => {
    return total + expense.amount;
  }, 0);

  const getDateRangeLabel = () => {
    if (dateFrom && dateTo) {
      return `${format(dateFrom, "MMM d, yyyy")} - ${format(dateTo, "MMM d, yyyy")}`;
    } else if (dateFrom) {
      return `From ${format(dateFrom, "MMM d, yyyy")}`;
    } else if (dateTo) {
      return `Until ${format(dateTo, "MMM d, yyyy")}`;
    } else {
      return "All Time";
    }
  };

  const getBuildingName = (buildingId?: string) => {
    if (!buildingId) return null;
    const building = buildings.find(b => b.id === buildingId);
    return building ? building.name : null;
  };

  const getUnitName = (buildingId?: string, unitId?: string) => {
    if (!buildingId || !unitId) return null;
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return null;
    const unit = building.units.find(u => u.id === unitId);
    return unit ? unit.name : null;
  };

  const getUnits = (buildingId: string) => {
    if (!buildingId) return [];
    const building = buildings.find(b => b.id === buildingId);
    return building ? building.units : [];
  };

  return (
    <Layout title="Expenses">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-rentroost-dark">Expenses</h2>
            <p className="text-gray-500">
              Track and manage all your property expenses
            </p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>
                  Record a new expense for your properties.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => date && setFormData({ ...formData, date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter Amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    placeholder="Add Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="building" className="text-right">
                    Property
                  </Label>
                  <select
                    id="building"
                    value={formData.buildingId}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        buildingId: e.target.value,
                        unitId: "" // Reset unit when building changes
                      });
                    }}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">-- Select Property (Optional) --</option>
                    {buildings.filter(b => b.ownerId === currentUser?.uid).map(building => (
                      <option key={building.id} value={building.id}>
                        {building.name}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.buildingId && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="unit" className="text-right">
                      Unit
                    </Label>
                    <select
                      id="unit"
                      value={formData.unitId}
                      onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">-- Select Unit (Optional) --</option>
                      {getUnits(formData.buildingId).map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddExpense}>Add Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">₹{filteredTotalExpenses.toLocaleString()}</div>
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                  <BadgeDollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{getDateRangeLabel()}</p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-md border">
          <div className="flex flex-col gap-4 p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Expense History</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Search expenses..."
                    className="pl-9 max-w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Date Range Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Filter by date:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM d, yyyy") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              {(dateFrom || dateTo) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDateFilters}
                  className="h-9"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              
              <div className="text-sm text-muted-foreground ml-auto">
                Showing {paginatedExpenses.length} of {filteredExpenses.length} expenses
              </div>
            </div>
          </div>
          
          {filteredExpenses.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>
                          {expense.buildingId ? getBuildingName(expense.buildingId) : "-"}
                        </TableCell>
                        <TableCell>
                          {expense.buildingId && expense.unitId
                            ? getUnitName(expense.buildingId, expense.unitId)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{expense.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {/* <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditExpense(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button> */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(prev => Math.max(prev - 1, 1));
                          }}
                          className={cn(
                            "cursor-pointer",
                            currentPage === 1 && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                }}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(prev => Math.min(prev + 1, totalPages));
                          }}
                          className={cn(
                            "cursor-pointer",
                            currentPage === totalPages && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rentroost-accent mb-4">
                <BadgeDollarSign className="h-6 w-6 text-rentroost-primary" />
              </div>
              <h4 className="text-lg font-medium mb-2">No Expenses Found</h4>
              <p className="text-gray-500 max-w-md mx-auto">
                You haven't recorded any expenses yet or none match your search.
              </p>
              <Button className="mt-4" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record an Expense
              </Button>
            </div>
          )}
        </div>

        {/* {editExpense && (
          <EditExpenseDialog
            expense={editExpense}
            open={editOpen}
            onOpenChange={(open) => {
              setEditOpen(open);
              if (!open) {
                setEditExpense(null);
              }
            }}
          />
        )} */}
      </div>
    </Layout>
  );
};

export default Expenses;
