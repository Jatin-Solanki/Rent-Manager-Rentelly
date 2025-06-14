import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { BadgeDollarSign, Plus, Search, Filter, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Expenses = () => {
  const { expenses, addExpense, buildings, deleteExpense } = useRentRoost();
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    if (!currentUser) return false;
    if (!expense.description) return false;
    
    return expense.description.toLowerCase().includes(searchTerm.toLowerCase());
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalExpenses = expenses.reduce((total, expense) => {
    if (!currentUser) return total;
    return total + expense.amount;
  }, 0);

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

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthExpenses = expenses
    .filter(expense => {
      const expenseDate = ensureDate(expense.date);
      return expenseDate >= startOfMonth && expenseDate <= today;
    })
    .reduce((total, expense) => total + expense.amount, 0);

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

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</div>
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                  <BadgeDollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">All time expenses</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Current Month Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">₹{currentMonthExpenses.toLocaleString()}</div>
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                  <BadgeDollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Expenses this month</p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-md border">
          <div className="flex items-center justify-between p-4 border-b">
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
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {filteredExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
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
                      <TableCell className="text-center">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this expense? This action cannot be undone.
                                <br /><br />
                                <strong>Amount:</strong> ₹{expense.amount.toLocaleString()}<br />
                                <strong>Description:</strong> {expense.description}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
      </div>
    </Layout>
  );
};

export default Expenses;