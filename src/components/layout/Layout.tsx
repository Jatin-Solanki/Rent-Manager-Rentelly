
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileSidebar } from "./MobileSidebar";
import { useRentRoost } from "@/context/RentRoostContext";
import { Loader2 } from "lucide-react";

type LayoutProps = {
  children: React.ReactNode;
  title: string;
};

export const Layout = ({ children, title }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoading } = useRentRoost();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-rentroost-primary" />
              <span className="ml-2 text-lg">Loading data from Firebase...</span>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
};
