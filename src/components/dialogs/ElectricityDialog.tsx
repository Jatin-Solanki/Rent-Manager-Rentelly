
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
import { ElectricFormData, DialogProps } from "@/types/tenant";
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

export function ElectricityDialog({ open, onClose, unit, onSubmit, loading, recordId }: DialogProps) {
  const [formData, setFormData] = useState<ElectricFormData>({
    date: new Date(),
    previousReading: 0,
    currentReading: 0,
    ratePerUnit: 8,
  });

  // Initialize electricityRecords array if it doesn't exist
  useEffect(() => {
    if (open && unit?.tenant && !unit.tenant.electricityRecords) {
      console.log("Initializing electricityRecords array for tenant");
      unit.tenant.electricityRecords = [];
    }
  }, [open, unit?.tenant]);

  // Reset form when dialog is opened and when recordId changes
  useEffect(() => {
    if (open) {
      console.log("Electricity Dialog opened, recordId:", recordId);
      
      if (recordId && unit?.tenant?.electricityRecords && Array.isArray(unit.tenant.electricityRecords)) {
        const record = unit.tenant.electricityRecords.find(r => r.id === recordId);
        console.log("Found electricity record to edit:", record);
        
        if (record) {
          try {
            setFormData({
              date: ensureValidDate(record.date),
              previousReading: Number(record.previousReading) || 0,
              currentReading: Number(record.currentReading) || 0,
              ratePerUnit: Number(record.ratePerUnit) || 8,
            });
          } catch (error) {
            console.error("Error setting electricity record data:", error);
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
    // Find the last electricity record to get the last reading
    let lastReading = 0;
    
    if (unit?.tenant?.electricityRecords && Array.isArray(unit.tenant.electricityRecords) && unit.tenant.electricityRecords.length > 0) {
      try {
        // Sort records by date (newest first)
        const sortedRecords = [...unit.tenant.electricityRecords].sort((a, b) => {
          const dateA = ensureValidDate(a.date);
          const dateB = ensureValidDate(b.date);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Use the current reading from the most recent record as the previous reading
        lastReading = Number(sortedRecords[0].currentReading) || 0;
      } catch (error) {
        console.error("Error finding last reading:", error);
      }
    }
    
    setFormData({
      date: new Date(),
      previousReading: lastReading,
      currentReading: lastReading,
      ratePerUnit: 8,
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date && !isNaN(date.getTime())) {
      setFormData({ ...formData, date });
    }
  };

  // Safely get sorted electricity records
  const sortedElectricityRecords = (() => {
    if (!unit?.tenant) return [];
    if (!unit.tenant.electricityRecords) {
      unit.tenant.electricityRecords = [];
      return [];
    }
    if (!Array.isArray(unit.tenant.electricityRecords)) {
      console.error("Electricity records is not an array:", unit.tenant.electricityRecords);
      unit.tenant.electricityRecords = [];
      return [];
    }
    
    try {
      return [...unit.tenant.electricityRecords].sort((a, b) => {
        const dateA = ensureValidDate(a.date);
        const dateB = ensureValidDate(b.date);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error("Error sorting records:", error);
      return [];
    }
  })();

  const recentRecords = sortedElectricityRecords.slice(0, 6);

  const handleEditClick = (record: any) => {
    if (record && record.id) {
      console.log("Edit button clicked for electricity record:", record.id);
      onSubmit({
        action: "edit",
        id: record.id
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-2xl mx-auto">
        <DialogHeader>
          <DialogTitle>
            {recordId ? "Edit Electricity Record" : "Add Electricity Record"}
          </DialogTitle>
          <DialogDescription>
            {recordId
              ? "Update the electricity consumption details."
              : "Enter the electricity consumption details for this month."}
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
            <Label htmlFor="previousReading" className="sm:text-right">
              Previous Reading
            </Label>
            <Input
              id="previousReading"
              type="number"
              placeholder="Enter previous month's reading"
              value={formData.previousReading}
              onChange={(e) => setFormData({ ...formData, previousReading: Number(e.target.value) })}
              className="col-span-1 sm:col-span-3"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="currentReading" className="sm:text-right">
              Current Reading
            </Label>
            <Input
              id="currentReading"
              type="number"
              placeholder="Enter current month's reading"
              value={formData.currentReading}
              onChange={(e) => setFormData({ ...formData, currentReading: Number(e.target.value) })}
              className="col-span-1 sm:col-span-3"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="ratePerUnit" className="sm:text-right">
              Rate per Unit
            </Label>
            <Input
              id="ratePerUnit"
              type="number"
              placeholder="Enter rate per unit"
              value={formData.ratePerUnit}
              onChange={(e) => setFormData({ ...formData, ratePerUnit: Number(e.target.value) })}
              className="col-span-1 sm:col-span-3"
              disabled={loading}
            />
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Recent Records</h3>
            <ScrollArea className="h-[200px] rounded-md border">
              <div className="p-4">
                {recentRecords && recentRecords.length > 0 ? (
                  recentRecords.map((record) => (
                    <Card key={record.id} className="p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-2">
                          <p className="text-sm font-medium">{`₹${record.amount} - ${record.unitsConsumed} units`}</p>
                          <p className="text-xs text-gray-500">{formatSafeDate(record.date)}</p>
                          <p className="text-xs text-gray-500">{`Reading: ${record.previousReading} → ${record.currentReading}`}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditClick(record);
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
                  <p className="text-sm text-gray-500 text-center py-4">No recent records</p>
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
              "Update Record"
            ) : (
              "Add Record"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
