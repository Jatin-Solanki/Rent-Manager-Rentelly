
import { Building } from "@/context/RentRoostContext";
import { Card, CardContent, CardFooter, CardHeader } from "./card";
import { Building as BuildingIcon } from "lucide-react";
import { Button } from "./button";

interface PropertyCardProps {
  building: Building;
  onSelect: (buildingId: string) => void;
}

export function PropertyCard({ building, onSelect }: PropertyCardProps) {
  const occupiedUnits = building.units.filter(unit => unit.tenant !== null).length;
  const occupancyRate = Math.round((occupiedUnits / building.unitsCount) * 100);
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-rentroost-primary text-white p-4 flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{building.name}</h3>
          {building.address && (
            <p className="text-sm text-white/80">{building.address}</p>
          )}
        </div>
        <div className="p-2 bg-white rounded-full text-rentroost-primary">
          <BuildingIcon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="text-center p-2 bg-rentroost-accent rounded">
            <p className="text-sm text-gray-500">Total Units</p>
            <p className="text-lg font-bold">{building.unitsCount}</p>
          </div>
          <div className="text-center p-2 bg-rentroost-accent rounded">
            <p className="text-sm text-gray-500">Occupancy</p>
            <p className="text-lg font-bold">{occupancyRate}%</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button variant="default" onClick={() => onSelect(building.id)}>
          View Units
        </Button>
      </CardFooter>
    </Card>
  );
}
