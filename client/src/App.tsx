import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/navigation";
import Analyzer from "@/pages/analyzer";
import Reports from "@/pages/reports";
import ContentIdeation from "@/pages/content-ideation";
import Chatbot from "@/pages/chatbot";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Switch>
        <Route path="/" component={Analyzer} />
        <Route path="/reports" component={Reports} />
        <Route path="/content-ideation" component={ContentIdeation} />
        <Route path="/chat" component={Chatbot} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="product-analyzer-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
