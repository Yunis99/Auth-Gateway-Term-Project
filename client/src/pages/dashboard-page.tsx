import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Server,
  Key,
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Service, ApiKey, RequestLog } from "@shared/schema";

interface DashboardStats {
  totalRequests: number;
  activeServices: number;
  activeApiKeys: number;
  errorRate: number;
  avgResponseTime: number;
  requestsTrend: number;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: number;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s/g, "-")}`}>
              {value}
            </span>
            {trend !== undefined && trend !== 0 && (
              <span
                className={`flex items-center text-xs font-medium ${
                  trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {trend > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function ServiceHealthCard({ service, loading }: { service?: Service; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
        <div className="flex items-center gap-3">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover-elevate">
      <div className="flex items-center gap-3">
        <div
          className={`h-2 w-2 rounded-full ${
            service.isActive ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm font-medium">{service.name}</span>
      </div>
      <Badge variant={service.isActive ? "secondary" : "destructive"} className="text-xs">
        {service.isActive ? "Healthy" : "Down"}
      </Badge>
    </div>
  );
}

function RecentRequestRow({ log, loading }: { log?: RequestLog; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    );
  }

  if (!log) return null;

  const statusColor =
    log.statusCode && log.statusCode >= 200 && log.statusCode < 300
      ? "text-green-600 dark:text-green-400"
      : log.statusCode && log.statusCode >= 400
      ? "text-red-600 dark:text-red-400"
      : "text-yellow-600 dark:text-yellow-400";

  const methodColors: Record<string, string> = {
    GET: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    POST: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    PUT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    PATCH: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <Badge className={`text-xs font-mono ${methodColors[log.method] || "bg-muted"}`}>
          {log.method}
        </Badge>
        <span className="text-sm font-mono truncate text-muted-foreground">{log.path}</span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {log.responseTime}ms
        </span>
        <span className={`text-sm font-medium ${statusColor}`}>{log.statusCode || "---"}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: recentLogs, isLoading: logsLoading } = useQuery<RequestLog[]>({
    queryKey: ["/api/logs", { limit: 5 }],
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome to Yunis's project
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" data-testid="button-view-logs">
            <Link href="/logs">View All Logs</Link>
          </Button>
          <Button asChild data-testid="button-add-service">
            <Link href="/services">
              <Server className="h-4 w-4 mr-2" />
              Add Service
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={stats?.totalRequests?.toLocaleString() ?? "0"}
          description="Last 24 hours"
          icon={Activity}
          trend={stats?.requestsTrend}
          loading={statsLoading}
        />
        <StatCard
          title="Active Services"
          value={stats?.activeServices ?? 0}
          description="Registered backends"
          icon={Server}
          loading={statsLoading}
        />
        <StatCard
          title="API Keys"
          value={stats?.activeApiKeys ?? 0}
          description="Active keys"
          icon={Key}
          loading={statsLoading}
        />
        <StatCard
          title="Error Rate"
          value={`${stats?.errorRate?.toFixed(1) ?? "0"}%`}
          description="Last 24 hours"
          icon={AlertCircle}
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Service Health</CardTitle>
              <CardDescription>Status of registered backend services</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/services" className="flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {servicesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <ServiceHealthCard key={i} loading />
              ))
            ) : services && services.length > 0 ? (
              services.slice(0, 5).map((service) => (
                <ServiceHealthCard key={service.id} service={service} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Server className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No services registered yet</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/services">Add your first service</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Recent Requests</CardTitle>
              <CardDescription>Latest API gateway activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/logs" className="flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <RecentRequestRow key={i} loading />
              ))
            ) : recentLogs && recentLogs.length > 0 ? (
              recentLogs.map((log) => <RecentRequestRow key={log.id} log={log} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No requests yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Requests will appear here as they come in
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2" data-testid="action-create-key">
              <Link href="/api-keys">
                <Key className="h-5 w-5" />
                <span>Create API Key</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2" data-testid="action-add-service">
              <Link href="/services">
                <Server className="h-5 w-5" />
                <span>Register Service</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2" data-testid="action-test-api">
              <Link href="/tester">
                <Activity className="h-5 w-5" />
                <span>Test API</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2" data-testid="action-view-docs">
              <Link href="/docs">
                <AlertCircle className="h-5 w-5" />
                <span>View Docs</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
