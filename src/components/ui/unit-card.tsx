import { Unit } from "@/context/RentRoostContext";
import { Card, CardContent, CardFooter, CardHeader } from "./card";
import { User, Home } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
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
} from "@/components/ui/alert-dialog"

interface UnitCardProps {
  unit: Unit;
  onAddDetails: (unitId: string) => void;
  onAddRent: (unitId: string) => void;
  onAddElectric: (unitId: string) => void;
  onMoveToPrevious: (unitId: string) => void;
}

export function UnitCard({ 
  unit, 
  onAddDetails, 
  onAddRent, 
  onAddElectric,
  onMoveToPrevious
}: UnitCardProps) {
  const hasTenant = unit.tenant !== null;
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      hasTenant ? "border-l-4 border-l-green-500" : "border-l-4 border-l-gray-300"
    )}>
      <CardHeader className="bg-rentroost-accent p-4 flex justify-between items-start">
        <div>
          <h3 className="font-medium text-rentroost-dark">{unit.name}</h3>
          {unit.floor && (
            <p className="text-sm text-gray-500">{unit.floor}</p>
          )}
        </div>
        <div className="p-2 bg-white rounded-full text-rentroost-primary shadow-sm">
          <Home className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {hasTenant ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-rentroost-primary" />
              <p className="font-medium">{unit.tenant?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Contact</p>
                <p>{unit.tenant?.contactNo}</p>
              </div>
              <div>
                <p className="text-gray-500">Members</p>
                <p>{unit.tenant?.memberCount}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-gray-500 text-sm">Rent Amount</p>
              <p className="font-bold text-rentroost-primary">₹{unit.tenant?.rentAmount}</p>
            </div>
          </div>
        ) : (
          <div className="py-2 text-center">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Vacant
            </Badge>
            <p className="mt-2 text-sm text-gray-500">No tenant assigned</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2 justify-between">
        <Button size="sm" variant="outline" onClick={() => onAddDetails(unit.id)}>
          {hasTenant ? "Edit Details" : "Add Details"}
        </Button>
        {hasTenant && (
          <>
            <Button size="sm" variant="outline" onClick={() => onAddRent(unit.id)}>
              Add Rent
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAddElectric(unit.id)}>
              Add Electric
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  Move to Previous
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Move Tenant to Previous?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move {unit.tenant?.name} to previous tenants. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onMoveToPrevious(unit.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Move to Previous
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
