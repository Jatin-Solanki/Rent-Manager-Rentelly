
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Building, 
  BellRing, 
  DollarSign, 
  BarChart3, 
  Users, 
  FileText,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
};

const SidebarItem = ({ 
  to, 
  icon: Icon, 
  text,
  onClick
}: { 
  to: string; 
  icon: React.ElementType; 
  text: string;
  onClick?: () => void;
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-rentroost-accent",
        isActive ? "bg-rentroost-primary text-white" : "text-rentroost-dark"
      )}
      onClick={onClick}
    >
      <Icon size={20} />
      <span className="font-medium">{text}</span>
    </Link>
  );
};

export const MobileSidebar = ({ open, onClose }: MobileSidebarProps) => {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[240px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-rentroost-primary p-2 rounded text-white mr-2">
                  <Building size={20} />
                </div>
                <SheetTitle className="text-lg">Rentelly</SheetTitle>
              </div>
              <Button  onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          
          <nav className="space-y-2 p-4 flex-1">
            <SidebarItem to="/" icon={Home} text="Dashboard" onClick={onClose} />
            <SidebarItem to="/buildings" icon={Building} text="Properties" onClick={onClose} />
            <SidebarItem to="/reminders" icon={BellRing} text="Reminders" onClick={onClose} />
            <SidebarItem to="/expenses" icon={DollarSign} text="Expenses" onClick={onClose} />
            <SidebarItem to="/reports" icon={BarChart3} text="Reports" onClick={onClose} />
            <SidebarItem to="/previous-tenants" icon={Users} text="Previous Tenants" onClick={onClose} />
          </nav>
          
          <div className="border-t border-gray-200 p-4">
            <a 
              href="#" 
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-rentroost-dark hover:bg-rentroost-accent"
            >
              {/* <FileText size={20} /> */}
              {/* <span className="font-medium">Documentation</span> */}
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
