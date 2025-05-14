
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Building, 
  BellRing, 
  DollarSign, 
  BarChart3, 
  Users, 
  FileText
} from "lucide-react";

const SidebarItem = ({ 
  to, 
  icon: Icon, 
  text 
}: { 
  to: string; 
  icon: React.ElementType; 
  text: string 
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
    >
      <Icon size={20} />
      <span className="font-medium">{text}</span>
    </Link>
  );
};

export const Sidebar = () => {
  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200 p-4 h-screen sticky top-0">
      <div className="flex items-center mb-8">
        <div className="bg-rentroost-primary p-2 rounded text-white mr-2">
          <Building size={24} />
        </div>
        <h2 className="text-xl font-bold text-rentroost-dark">Rentelly</h2>
      </div>
      
      <nav className="space-y-2 flex-1">
        <SidebarItem to="/" icon={Home} text="Dashboard" />
        <SidebarItem to="/buildings" icon={Building} text="Properties" />
        <SidebarItem to="/reminders" icon={BellRing} text="Reminders" />
        <SidebarItem to="/expenses" icon={DollarSign} text="Expenses" />
        <SidebarItem to="/reports" icon={BarChart3} text="Reports" />
        <SidebarItem to="/previous-tenants" icon={Users} text="Previous Tenants" />
      </nav>
      
      {/* <div className="border-t border-gray-200 pt-4 mt-4">
        <a 
          href="#" 
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-rentroost-dark hover:bg-rentroost-accent"
        >
          <FileText size={20} />
          <span className="font-medium">Documentation</span>
        </a>
      </div> */}
    </aside>
  );
};
