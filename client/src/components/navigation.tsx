import { Link, useLocation } from "wouter";
import { BarChart3, Microscope, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

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
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="text-primary text-xl" />
              <h1 className="text-xl font-semibold text-slate-900">Product Analyzer</h1>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <span className={cn(
                    "flex items-center space-x-2 font-medium pb-4 -mb-4 transition-colors cursor-pointer",
                    isActive 
                      ? "text-primary border-b-2 border-primary" 
                      : "text-slate-600 hover:text-slate-900"
                  )}>
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
