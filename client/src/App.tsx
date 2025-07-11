import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/navigation";
import Analyzer from "@/pages/analyzer";
import Reports from "@/pages/reports";
import ContentIdeation from "@/pages/content-ideation";
import Chatbot from "@/pages/chatbot";

function Router() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Analyzer} />
          <Route path="/reports" component={Reports} />
          <Route path="/content-ideation" component={ContentIdeation} />
          <Route path="/chat" component={Chatbot} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
