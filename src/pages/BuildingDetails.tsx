
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { TenantFormData, RentFormData, ElectricFormData } from "@/types/tenant";
import { useRentRoost } from "@/context/RentRoostContext";
import { TenantDetailsDialog } from "@/components/dialogs/TenantDetailsDialog";
import { RentPaymentDialog } from "@/components/dialogs/RentPaymentDialog";
import { ElectricityDialog } from "@/components/dialogs/ElectricityDialog";
import { uploadTenantDocument } from "@/lib/firebaseUtils";
import { Building, Unit } from "@/context/RentRoostContext";
import { UnitCard } from "@/components/ui/unit-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building as BuildingIcon, Home, User } from "lucide-react";
import { toast } from "sonner";

type DialogType = "details" | "rent" | "electric" | null;

const BuildingDetails = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const navigate = useNavigate();
  const { buildings, selectBuilding, currentBuilding, addTenant, addRentPayment, addElectricityRecord, moveTenantToPrevious, editRentPayment, editElectricityRecord } = useRentRoost();
  
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (buildingId) {
      selectBuilding(buildingId);
    }
  }, [buildingId, selectBuilding]);

  if (!currentBuilding) {
    return (
      <Layout title="Building Not Found">
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Building not found</p>
          <Button className="mt-4" onClick={() => navigate("/buildings")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Buildings
          </Button>
        </div>
      </Layout>
    );
  }

  const handleCloseDialog = () => {
    setDialogType(null);
    setSelectedUnit(null);
    setLoading(false);
    setSelectedRecordId(null);
  };

  const handleOpenDialog = (type: DialogType, unit: Unit, recordId?: string) => {
    console.log(`Opening ${type} dialog for unit ${unit.id} with recordId: ${recordId || "none"}`);
    setDialogType(type);
    setSelectedUnit(unit);
    setSelectedRecordId(recordId || null);
  };

  const handleAddTenant = async (formData: TenantFormData) => {
    if (!selectedUnit) return;
    
    try {
      setLoading(true);
      
      if (!formData.name || !formData.contactNo) {
        toast.error("Name and contact number are required");
        setLoading(false);
        return;
      }
      
      let otherDocumentsUrl = formData.otherDocuments;
      
      if (formData.otherDocuments instanceof File) {
        try {
          otherDocumentsUrl = await uploadTenantDocument(
            formData.otherDocuments,
            buildingId as string,
            selectedUnit.id,
            "otherDocuments"
          );
        } catch (error) {
          console.error("Error uploading other documents:", error);
          toast.error("Failed to upload other documents");
          setLoading(false);
          return;
        }
      }
      
      let idProofUrl = formData.idProof;
      if (formData.idProof instanceof File) {
        try {
          idProofUrl = await uploadTenantDocument(
            formData.idProof,
            buildingId as string,
            selectedUnit.id,
            "idProof"
          );
        } catch (error) {
          console.error("Error uploading ID proof:", error);
          toast.error("Failed to upload ID proof");
          setLoading(false);
          return;
        }
      }
      
      let policeVerificationUrl = formData.policeVerification;
      if (formData.policeVerification instanceof File) {
        try {
          policeVerificationUrl = await uploadTenantDocument(
            formData.policeVerification,
            buildingId as string,
            selectedUnit.id,
            "policeVerification"
          );
        } catch (error) {
          console.error("Error uploading police verification:", error);
          toast.error("Failed to upload police verification");
          setLoading(false);
          return;
        }
      }
      
      await addTenant(selectedUnit.id, {
        name: formData.name,
        contactNo: formData.contactNo,
        memberCount: Number(formData.memberCount) || 1,
        rentAmount: Number(formData.rentAmount) || 0,
        roomDetails: formData.roomDetails,
        about: formData.about,
        moveInDate: formData.moveInDate,
        idProof: idProofUrl,
        policeVerification: policeVerificationUrl,
        otherDocuments: otherDocumentsUrl,
      });
      
      handleCloseDialog();
    } catch (error) {
      console.error("Error in handleAddTenant:", error);
      toast.error("Failed to add tenant: " + (error instanceof Error ? error.message : "Unknown error"));
      setLoading(false);
    }
  };

  const handleAddRent = async (formData: any) => {
    if (!selectedUnit) return;
    
    try {
      // Handle the case when the edit button is clicked from the list
      if (formData.action === "edit" && formData.id) {
        console.log("Received edit request for rent payment:", formData.id);
        setSelectedRecordId(formData.id);
        return; // Don't set loading state here, just return
      }
      
      setLoading(true);
      
      if (!formData.amount) {
        toast.error("Amount is required");
        setLoading(false);
        return;
      }
      
      // Ensure we have a valid date
      if (formData.date && !(formData.date instanceof Date && !isNaN(formData.date.getTime()))) {
        console.error("Invalid date in form data:", formData.date);
        formData.date = new Date(); // Use current date as fallback
      }
      
      // Initialize tenant.rentPayments if it doesn't exist or is not an array
      if (!selectedUnit.tenant) {
        toast.error("No tenant found for this unit");
        setLoading(false);
        return;
      }
      
      if (!selectedUnit.tenant.rentPayments || !Array.isArray(selectedUnit.tenant.rentPayments)) {
        console.log("Initializing rentPayments array for tenant");
        selectedUnit.tenant.rentPayments = [];
      }

      try {
        if (selectedRecordId) {
          console.log("Editing rent payment with ID:", selectedRecordId);
          await editRentPayment(selectedUnit.id, selectedRecordId, formData);
          toast.success("Rent payment updated successfully");
        } else {
          console.log("Adding new rent payment:", formData);
          await addRentPayment(selectedUnit.id, formData);
          toast.success("Rent payment added successfully");
        }
        
        handleCloseDialog();
      } catch (error) {
        console.error("Error processing rent payment:", error);
        toast.error("Failed to " + (selectedRecordId ? "update" : "add") + " rent payment: " + (error instanceof Error ? error.message : "Unknown error"));
        setLoading(false);
      }
    } catch (error) {
      console.error("Error in handleAddRent:", error);
      toast.error("Failed to " + (selectedRecordId ? "update" : "add") + " rent payment");
      setLoading(false);
    }
  };

  const handleAddElectric = async (formData: any) => {
    if (!selectedUnit) return;
    
    try {
      // Handle the case when the edit button is clicked from the list
      if (formData.action === "edit" && formData.id) {
        console.log("Received edit request for electricity record:", formData.id);
        setSelectedRecordId(formData.id);
        return; // Don't set loading state here, just return
      }
      
      setLoading(true);
      
      if (formData.currentReading === undefined || formData.currentReading === null) {
        toast.error("Current reading is required");
        setLoading(false);
        return;
      }
      
      const previousReading = Number(formData.previousReading);
      const currentReading = Number(formData.currentReading);
      
      if (currentReading < previousReading) {
        toast.error("Current reading cannot be less than previous reading");
        setLoading(false);
        return;
      }
      
      // Ensure we have a valid date
      if (formData.date && !(formData.date instanceof Date && !isNaN(formData.date.getTime()))) {
        console.error("Invalid date in form data:", formData.date);
        formData.date = new Date(); // Use current date as fallback
      }
      
      // Initialize tenant.electricityRecords if it doesn't exist or is not an array
      if (!selectedUnit.tenant) {
        toast.error("No tenant found for this unit");
        setLoading(false);
        return;
      }
      
      if (!selectedUnit.tenant.electricityRecords || !Array.isArray(selectedUnit.tenant.electricityRecords)) {
        console.log("Initializing electricityRecords array for tenant");
        selectedUnit.tenant.electricityRecords = [];
      }
      
      const unitsConsumed = currentReading - previousReading;
      const amount = unitsConsumed * Number(formData.ratePerUnit);
      
      const record = {
        ...formData,
        previousReading,
        currentReading,
        unitsConsumed,
        amount,
        ratePerUnit: Number(formData.ratePerUnit),
      };

      try {
        if (selectedRecordId) {
          console.log("Editing electricity record with ID:", selectedRecordId, record);
          await editElectricityRecord(selectedUnit.id, selectedRecordId, record);
          toast.success("Electricity record updated successfully");
        } else {
          console.log("Adding new electricity record:", record);
          await addElectricityRecord(selectedUnit.id, record);
          toast.success("Electricity record added successfully");
        }
        
        handleCloseDialog();
      } catch (error) {
        console.error("Error processing electricity record:", error);
        toast.error("Failed to " + (selectedRecordId ? "update" : "add") + " electricity record: " + (error instanceof Error ? error.message : "Unknown error"));
        setLoading(false);
      }
    } catch (error) {
      console.error("Error in handleAddElectric:", error);
      toast.error("Failed to " + (selectedRecordId ? "update" : "add") + " electricity record");
      setLoading(false);
    }
  };

  const occupiedUnits = currentBuilding.units.filter(unit => unit.tenant !== null).length;
  
  return (
    <Layout title={currentBuilding.name}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/buildings")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-rentroost-dark">{currentBuilding.name}</h2>
            <p className="text-gray-500">
              {currentBuilding.address || `${occupiedUnits} of ${currentBuilding.unitsCount} units occupied`}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-rentroost-primary text-white">
                <BuildingIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Total Units</h3>
                <p className="text-2xl font-bold">{currentBuilding.unitsCount}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500 text-white">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Occupied Units</h3>
                <p className="text-2xl font-bold">{occupiedUnits}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500 text-white">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Vacant Units</h3>
                <p className="text-2xl font-bold">{currentBuilding.unitsCount - occupiedUnits}</p>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-rentroost-dark mt-6">All Units</h3>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {currentBuilding.units.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onAddDetails={(unitId) => {
                const unit = currentBuilding.units.find(u => u.id === unitId);
                if (unit) handleOpenDialog("details", unit);
              }}
              onAddRent={(unitId) => {
                const unit = currentBuilding.units.find(u => u.id === unitId);
                if (unit && unit.tenant) handleOpenDialog("rent", unit);
              }}
              onAddElectric={(unitId) => {
                const unit = currentBuilding.units.find(u => u.id === unitId);
                if (unit && unit.tenant) handleOpenDialog("electric", unit);
              }}
              onMoveToPrevious={(unitId) => {
                const unit = currentBuilding.units.find(u => u.id === unitId);
                if (unit && unit.tenant) {
                  setSelectedUnit(unit);
                  setLoading(true);
                  moveTenantToPrevious(unitId)
                    .then(() => {
                      toast.success("Tenant moved to previous renters");
                      setLoading(false);
                    })
                    .catch(error => {
                      console.error("Error moving tenant:", error);
                      toast.error("Failed to move tenant: " + (error instanceof Error ? error.message : "Unknown error"));
                      setLoading(false);
                    });
                }
              }}
            />
          ))}
        </div>
      </div>

      <TenantDetailsDialog
        open={dialogType === "details"}
        onClose={handleCloseDialog}
        unit={selectedUnit}
        onSubmit={handleAddTenant}
        loading={loading}
      />

      <RentPaymentDialog
        open={dialogType === "rent"}
        onClose={handleCloseDialog}
        unit={selectedUnit}
        onSubmit={handleAddRent}
        loading={loading}
        recordId={selectedRecordId}
      />

      <ElectricityDialog
        open={dialogType === "electric"}
        onClose={handleCloseDialog}
        unit={selectedUnit}
        onSubmit={handleAddElectric}
        loading={loading}
        recordId={selectedRecordId}
      />
    </Layout>
  );
};

export default BuildingDetails;
