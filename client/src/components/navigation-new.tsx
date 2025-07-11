// Enhanced navigation component with improved accessibility and UX
import { Link, useLocation } from "wouter";
import { BarChart3, Microscope, Folder, Sparkles, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useReports } from "@/hooks/use-reports";
import { APP_CONFIG, ROUTES } from "@/constants";
import type { NavItem } from "@/types";

// Navigation configuration
const navItems: NavItem[] = [
  {
    path: ROUTES.ANALYZER,
    label: "Analyzer",
    icon: Microscope,
    description: "Analyze products and generate insights",
  },
  {
    path: ROUTES.REPORTS,
    label: "My Reports",
    icon: Folder,
    description: "View and manage your analysis reports",
  },
  {
    path: ROUTES.CONTENT_IDEATION,
    label: "Content Ideation",
    icon: Sparkles,
    description: "Generate content ideas and marketing copy",
  },
  {
    path: ROUTES.CHAT,
    label: "AI Assistant",
    icon: MessageCircle,
    description: "Chat with AI for product insights",
  },
];

interface NavigationProps {
  className?: string;
}

export default function Navigation({ className }: NavigationProps) {
  const [location] = useLocation();
  const { data: reports } = useReports();

  return (
    <TooltipProvider>
      <nav className={cn(
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-b border-border sticky top-0 z-50",
        className
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <Link href={ROUTES.HOME} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <BarChart3 className="text-primary h-6 w-6" />
                <h1 className="text-xl font-semibold text-foreground">
                  {APP_CONFIG.NAME}
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        asChild
                        className="relative"
                      >
                        <Link href={item.path}>
                          <Icon className="h-4 w-4 mr-2" />
                          {item.label}
                          {/* Badge for reports count */}
                          {item.path === ROUTES.REPORTS && reports?.length && (
                            <Badge variant="secondary" className="ml-2 h-5 text-xs">
                              {reports.length}
                            </Badge>
                          )}
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        asChild
                        className="relative"
                      >
                        <Link href={item.path}>
                          <Icon className="h-4 w-4" />
                          {item.path === ROUTES.REPORTS && reports?.length && (
                            <Badge 
                              variant="destructive" 
                              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                            >
                              {reports.length > 99 ? '99+' : reports.length}
                            </Badge>
                          )}
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
