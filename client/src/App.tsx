import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ServicesPage from "@/pages/services-page";
import ApiKeysPage from "@/pages/api-keys-page";
import LogsPage from "@/pages/logs-page";
import MonitoringPage from "@/pages/monitoring-page";
import ApiTesterPage from "@/pages/api-tester-page";
import DocsPage from "@/pages/docs-page";
import AdminUsersPage from "@/pages/admin/users-page";
import NotFound from "@/pages/not-found";

function AppLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex h-14 items-center justify-between gap-4 px-4 border-b border-border shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ProtectedRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/services" component={ServicesPage} />
        <Route path="/api-keys" component={ApiKeysPage} />
        <Route path="/logs" component={LogsPage} />
        <Route path="/monitoring" component={MonitoringPage} />
        <Route path="/tester" component={ApiTesterPage} />
        <Route path="/docs" component={DocsPage} />
        <Route path="/admin/users">
          {() => (
            <ProtectedRoute requiredRole="admin">
              <AdminUsersPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route>
        {() => (
          <ProtectedRoute>
            <ProtectedRoutes />
          </ProtectedRoute>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="api-gateway-theme">
        <TooltipProvider>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
