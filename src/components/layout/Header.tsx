
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type HeaderProps = {
  title: string;
  onMenuClick: () => void;
};

export const Header = ({ title, onMenuClick }: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between px-4 py-3 md:px-6 transition-all",
        scrolled ? "bg-white shadow-sm" : "bg-transparent"
      )}
    >
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <h1 className="text-xl font-bold text-rentroost-dark">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {currentUser && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-rentroost-dark hidden sm:inline">
              {currentUser.email}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-rentroost-dark hover:text-rentroost-primary"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span>Sign out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
