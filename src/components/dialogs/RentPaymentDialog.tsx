
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { CalendarIcon, Edit, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { RentFormData, DialogProps } from "@/types/tenant";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

const ensureValidDate = (date: unknown): Date => {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  
  if (date && typeof date === 'object' && 'seconds' in date) {
    return new Date((date as any).seconds * 1000);
  }
  
  if (date && typeof date === 'string') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  return new Date();
};

const formatSafeDate = (date: unknown): string => {
  try {
    const validDate = ensureValidDate(date);
    return format(validDate, "PPP");
  } catch (error) {
    console.error("Error formatting date:", error, date);
    return "Invalid date";
  }
};

export function RentPaymentDialog({ open, onClose, unit, onSubmit, loading, recordId }: DialogProps) {
  const [formData, setFormData] = useState<RentFormData>({
    date: new Date(),
    amount: 0,
    month: format(new Date(), 'MMMM'),
    year: new Date().getFullYear(),
    paymentMethod: "",
    remarks: "",
  });

  // Initialize rentPayments array if it doesn't exist
  useEffect(() => {
    if (open && unit?.tenant && !unit.tenant.rentPayments) {
      console.log("Initializing rentPayments array for tenant");
      unit.tenant.rentPayments = [];
    }
  }, [open, unit?.tenant]);

  // Reset form when dialog is opened and when recordId changes
  useEffect(() => {
    if (open) {
      console.log("Rent Dialog opened, recordId:", recordId);
      
      if (recordId && unit?.tenant?.rentPayments && Array.isArray(unit.tenant.rentPayments)) {
        const payment = unit.tenant.rentPayments.find(p => p.id === recordId);
        console.log("Found payment to edit:", payment);
        
        if (payment) {
          try {
            setFormData({
              date: ensureValidDate(payment.date),
              amount: Number(payment.amount) || 0,
              month: payment.month || format(new Date(), 'MMMM'),
              year: Number(payment.year) || new Date().getFullYear(),
              paymentMethod: payment.paymentMethod || "",
              remarks: payment.remarks || "",
            });
          } catch (error) {
            console.error("Error setting rent payment data:", error);
            resetForm();
          }
        }
      } else {
        // Reset form if not editing an existing record
        resetForm();
      }
    }
  }, [recordId, open, unit?.tenant]);

  const resetForm = () => {
    setFormData({
      date: new Date(),
      amount: unit?.tenant?.rentAmount || 0,
      month: format(new Date(), 'MMMM'),
      year: new Date().getFullYear(),
      paymentMethod: "",
      remarks: "",
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date && !isNaN(date.getTime())) {
      setFormData({ ...formData, date });
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  // Safely get sorted rent payments
  const sortedRentPayments = (() => {
    if (!unit?.tenant) return [];
    if (!unit.tenant.rentPayments) {
      unit.tenant.rentPayments = [];
      return [];
    }
    if (!Array.isArray(unit.tenant.rentPayments)) {
      console.error("Rent payments is not an array:", unit.tenant.rentPayments);
      unit.tenant.rentPayments = [];
      return [];
    }
    
    try {
      return [...unit.tenant.rentPayments].sort((a, b) => {
        const dateA = ensureValidDate(a.date);
        const dateB = ensureValidDate(b.date);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error("Error sorting rent payments:", error);
      return [];
    }
  })();

  const recentPayments = sortedRentPayments.slice(0, 6);

  const handleEditClick = (payment: any) => {
    if (payment && payment.id) {
      console.log("Edit button clicked for payment:", payment.id);
      onSubmit({
        action: "edit",
        id: payment.id
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-2xl mx-auto">
        <DialogHeader>
          <DialogTitle>
            {recordId ? "Edit Rent Payment" : "Add Rent Payment"}
          </DialogTitle>
          <DialogDescription>
            {recordId
              ? "Update the details for the current rent payment."
              : "Add details for a new rent payment."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="date" className="sm:text-right">
              Date
            </Label>
            <div className="col-span-1 sm:col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={handleDateChange}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="amount" className="sm:text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter rent amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="col-span-1 sm:col-span-3"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="month" className="sm:text-right">
              Month
            </Label>
            <select
              id="month"
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              className="col-span-1 sm:col-span-3 w-full h-10 px-3 rounded-md border border-input bg-background"
              disabled={loading}
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="year" className="sm:text-right">
              Year
            </Label>
            <select
              id="year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              className="col-span-1 sm:col-span-3 w-full h-10 px-3 rounded-md border border-input bg-background"
              disabled={loading}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="paymentMethod" className="sm:text-right">
              Payment Method
            </Label>
            <Input
              id="paymentMethod"
              type="text"
              placeholder="Enter payment method"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="col-span-1 sm:col-span-3"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="remarks" className="sm:text-right">
              Remarks
            </Label>
            <Input
              id="remarks"
              type="text"
              placeholder="Enter remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="col-span-1 sm:col-span-3"
              disabled={loading}
            />
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Recent Payments</h3>
            <ScrollArea className="h-[200px] rounded-md border">
              <div className="p-4">
                {recentPayments && recentPayments.length > 0 ? (
                  recentPayments.map((payment) => (
                    <Card key={payment.id} className="p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-2">
                          <p className="text-sm font-medium">{`₹${payment.amount} - ${payment.month} ${payment.year}`}</p>
                          <p className="text-xs text-gray-500">{formatSafeDate(payment.date)}</p>
                          {payment.paymentMethod && (
                            <p className="text-xs text-gray-500">{`Method: ${payment.paymentMethod}`}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditClick(payment);
                          }}
                          className="flex-shrink-0"
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent payments</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={() => onSubmit(formData)} 
            disabled={loading} 
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : recordId ? (
              "Update Payment"
            ) : (
              "Add Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
