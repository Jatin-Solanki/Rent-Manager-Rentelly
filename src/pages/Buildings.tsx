
import { useState, useEffect } from "react";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";
import { Layout } from "@/components/layout/Layout";
import { Plus, Search, Building as BuildingIcon } from "lucide-react";
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
import { PropertyCard } from "@/components/ui/property-card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const Buildings = () => {
  const { buildings, addBuilding, deleteBuilding } = useRentRoost();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBuildingForDelete, setSelectedBuildingForDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unitsCount: "",
    address: ""
  });

  const handleAddBuilding = async () => {
    if (!formData.name || !formData.unitsCount) {
      toast.error("Please fill in the required fields");
      return;
    }

    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!currentUser) {
        toast.error("You must be logged in to add properties");
        setLoading(false);
        return;
      }
      
      console.log("Adding building with data:", { 
        name: formData.name, 
        unitsCount: Number(formData.unitsCount), 
        address: formData.address,
        userId: currentUser.uid 
      });
      
      const success = await addBuilding(
        formData.name,
        Number(formData.unitsCount),
        formData.address
      );
      
      if (success) {
        setFormData({ name: "", unitsCount: "", address: "" });
        setOpen(false);
        toast.success("Property added successfully");
      } else {
        toast.error("Failed to add property. Please try again.");
      }
    } catch (error) {
      console.error("Error in handleAddBuilding:", error);
      
      // Display more detailed error message to help diagnose the issue
      if (error instanceof Error) {
        if (error.message?.includes("permission")) {
          toast.error("Permission denied: Make sure you have the right access and are logged in.");
        } else if (error.message?.includes("ownerId")) {
          toast.error("Error with owner ID: The property could not be associated with your account.");
        } else {
          toast.error(`Failed to add property: ${error.message}`);
        }
      } else {
        toast.error("Failed to add property. Please check your connection and permissions.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBuilding = (buildingId: string) => {
    navigate(`/buildings/${buildingId}`);
  };

  const handleDeleteBuilding = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    if (building) {
      setSelectedBuildingForDelete({ id: building.id, name: building.name });
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBuildingForDelete) return;

    try {
      setDeleteLoading(true);
      await deleteBuilding(selectedBuildingForDelete.id);
      setDeleteDialogOpen(false);
      setSelectedBuildingForDelete(null);
    } catch (error) {
      console.error("Error deleting building:", error);
      // Error handling is done in the context
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedBuildingForDelete(null);
  };

  useEffect(() => {
    // Log buildings data to debug display issues
    console.log("Current buildings data:", buildings);
  }, [buildings]);

  const filteredBuildings = buildings.filter(building => 
    building.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Properties">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-rentroost-dark">Properties</h2>
            <p className="text-gray-500">Manage your buildings and units</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Property</DialogTitle>
                <DialogDescription>
                  Enter the details for your new property.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Property name"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unitsCount" className="text-right">
                    Units
                  </Label>
                  <Input
                    id="unitsCount"
                    value={formData.unitsCount}
                    onChange={(e) => setFormData({ ...formData, unitsCount: e.target.value })}
                    placeholder="Number of units"
                    type="number"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Property address (optional)"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleAddBuilding} disabled={loading}>
                  {loading ? "Adding..." : "Add Property"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search properties..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {buildings.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBuildings.map((building) => (
               <PropertyCard
                key={building.id}
                building={building}
                onSelect={handleSelectBuilding}
                onDelete={handleDeleteBuilding}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rentroost-accent mb-4">
              <BuildingIcon className="h-8 w-8 text-rentroost-primary" />
            </div>
            <h3 className="text-xl font-medium text-rentroost-dark mb-2">No Properties Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              You haven't added any properties yet. Start managing your rental properties by adding your first property.
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Button>
          </div>
        )}

        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          title="Delete Property"
          description="Are you sure you want to delete this property?"
          itemName={selectedBuildingForDelete?.name || ""}
          loading={deleteLoading}
        />
      </div>
    </Layout>
  );
};

export default Buildings;