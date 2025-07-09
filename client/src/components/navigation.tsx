import { Link, useLocation } from "wouter";
import { BarChart3, Microscope, Folder, Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    {
      path: "/",
      label: "Analyzer",
      icon: Microscope,
    },
    {
      path: "/reports",
      label: "My Reports", 
      icon: Folder,
    },
    {
      path: "/content-ideation",
      label: "Content Ideation",
      icon: Sparkles,
    },
    {
      path: "/chat",
      label: "AI Assistant",
      icon: MessageCircle,
    },
  ];

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="text-primary text-xl" />
              <h1 className="text-xl font-semibold text-foreground">Product Analyzer</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3 md:space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <Link href={item.path}>
                      <span className={cn(
                        "flex items-center space-x-0 md:space-x-2 font-medium pb-4 -mb-4 transition-colors cursor-pointer",
                        isActive 
                          ? "text-primary border-b-2 border-primary" 
                          : "text-muted-foreground hover:text-foreground"
                      )}>
                        <Icon className="w-4 h-4" />
                        <span className="hidden md:inline">{item.label}</span>
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="md:hidden">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
