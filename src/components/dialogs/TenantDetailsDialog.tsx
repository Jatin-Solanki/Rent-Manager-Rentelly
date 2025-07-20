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
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { CalendarIcon, FileImage, FileText, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { TenantFormData, DialogProps } from "@/types/tenant";
import { handleFileView } from "@/lib/fileUtils";

// Helper function to safely parse dates
const ensureValidDate = (date: unknown): Date => {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  
  if (date && typeof date === 'object' && 'seconds' in date) {
    // Handle Firebase Timestamp
    return new Date((date as any).seconds * 1000);
  }
  
  if (date && typeof date === 'string') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // Default to current date if invalid
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

export function TenantDetailsDialog({ open, onClose, unit, onSubmit, loading }: DialogProps) {
  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    contactNo: "",
    memberCount: "",
    rentAmount: "",
    roomDetails: "",
    about: "",
    dateOfBirth: "",
    idProof: null,
    policeVerification: null,
    moveInDate: new Date(),
    otherDocuments: null,
  });

  useEffect(() => {
    if (unit?.tenant) {
      try {
        setFormData({
          name: unit.tenant.name || "",
          contactNo: unit.tenant.contactNo || "",
          memberCount: unit.tenant.memberCount?.toString() || "",
          rentAmount: unit.tenant.rentAmount?.toString() || "",
          roomDetails: unit.tenant.roomDetails || "",
          about: unit.tenant.about || "",
          dateOfBirth: unit.tenant.dateOfBirth || "",
          idProof: unit.tenant.idProof || null,
          policeVerification: unit.tenant.policeVerification || null,
          moveInDate: unit.tenant.moveInDate ? ensureValidDate(unit.tenant.moveInDate) : new Date(),
          otherDocuments: unit.tenant.otherDocuments || null,
        });
      } catch (error) {
        console.error("Error setting tenant form data:", error);
        // Reset to defaults on error
        setFormData({
          name: "",
          contactNo: "",
          memberCount: "",
          rentAmount: "",
          roomDetails: "",
          about: "",
          dateOfBirth: "",
          idProof: null,
          policeVerification: null,
          moveInDate: new Date(),
          otherDocuments: null,
        });
      }
    } else {
      // Reset form data when no tenant exists
      setFormData({
        name: "",
        contactNo: "",
        memberCount: "",
        rentAmount: "",
        roomDetails: "",
        about: "",
        dateOfBirth: "",
        idProof: null,
        policeVerification: null,
        moveInDate: new Date(),
        otherDocuments: null,
      });
    }
  }, [unit?.tenant, open]);

  const handleDateChange = (date: Date | undefined) => {
    if (date && !isNaN(date.getTime())) {
      setFormData({ ...formData, moveInDate: date });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {unit?.tenant ? "Edit Tenant Details" : "Add Tenant Details"}
          </DialogTitle>
          <DialogDescription>
            {unit?.tenant
              ? "Update the details for the current tenant."
              : "Add details for a new tenant."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              placeholder="Enter tenant's full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactNo" className="text-right">
              Contact
            </Label>
            <Input
              id="contactNo"
              placeholder="Enter 10-digit mobile number"
              value={formData.contactNo}
              onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="memberCount" className="text-right">
              Members
            </Label>
            <Input
              id="memberCount"
              type="number"
              placeholder="Number of family members"
              value={formData.memberCount}
              onChange={(e) => setFormData({ ...formData, memberCount: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rentAmount" className="text-right">
              Rent
            </Label>
            <Input
              id="rentAmount"
              type="number"
              placeholder="Monthly rent amount"
              value={formData.rentAmount}
              onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="roomDetails" className="text-right">
              Room Details
            </Label>
            <Input
              id="roomDetails"
              placeholder="Room number or specific details"
              value={formData.roomDetails}
              onChange={(e) => setFormData({ ...formData, roomDetails: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="about" className="text-right">
              About
            </Label>
            <Textarea
              id="about"
              placeholder="Additional information about the tenant"
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              className="col-span-3"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dateOfBirth" className="text-right">
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              type="password"
              placeholder="Enter date of birth (DD/MM/YYYY)"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="idProof" className="text-right">
              ID Proof
            </Label>
            <div className="col-span-3 space-y-2">
              {unit?.tenant?.idProof && typeof unit.tenant.idProof === 'string' && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-md">
                  <FileImage className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600 flex-1 truncate">Current ID Proof</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleFileView(unit.tenant?.idProof as string)}
                    type="button"
                  >
                    View
                  </Button>
                </div>
              )}
              <Input
                id="idProof"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setFormData({ ...formData, idProof: file });
                }}
              />
              <p className="text-xs text-gray-500">
                {formData.idProof ? "New file selected" : "Upload new file to replace current"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="policeVerification" className="text-right">
              Police Verification
            </Label>
            <div className="col-span-3 space-y-2">
              {unit?.tenant?.policeVerification && typeof unit.tenant.policeVerification === 'string' && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-md">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600 flex-1 truncate">Current Police Verification</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleFileView(unit.tenant?.policeVerification as string)}
                    type="button"
                  >
                    View
                  </Button>
                </div>
              )}
              <Input
                id="policeVerification"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setFormData({ ...formData, policeVerification: file });
                }}
              />
              <p className="text-xs text-gray-500">
                {formData.policeVerification ? "New file selected" : "Upload new file to replace current"}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="moveInDate" className="text-right">
              Move-in Date
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.moveInDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.moveInDate ? (
                      format(formData.moveInDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.moveInDate}
                    onSelect={handleDateChange}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="otherDocuments" className="text-right">
              Other Documents
            </Label>
            <div className="col-span-3 space-y-2">
              {unit?.tenant?.otherDocuments && typeof unit.tenant.otherDocuments === 'string' && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-md">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600 flex-1 truncate">Current Document</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleFileView(unit.tenant?.otherDocuments as string)}
                    type="button"
                  >
                    View
                  </Button>
                </div>
              )}
              <Input
                id="otherDocuments"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setFormData({ ...formData, otherDocuments: file });
                }}
              />
              <p className="text-xs text-gray-500">
                {formData.otherDocuments ? "New file selected" : "Upload new file (PDF or Image)"}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(formData)} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : unit?.tenant ? "Update Tenant" : "Add Tenant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}