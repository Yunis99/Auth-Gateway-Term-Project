import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Server,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { queryClient } from "@/lib/queryClient";
import type { Service } from "@shared/schema";

interface MonitoringStats {
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  successRate: number;
  requestsTrend: number;
  responseTimeTrend: number;
}

interface TimeSeriesData {
  timestamp: string;
  requests: number;
  responseTime: number;
  errors: number;
}

interface ServiceStats {
  serviceId: string;
  serviceName: string;
  requests: number;
  avgResponseTime: number;
  errorRate: number;
}

const CHART_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(173, 58%, 39%)",
  "hsl(197, 37%, 45%)",
  "hsl(43, 74%, 49%)",
  "hsl(27, 87%, 55%)",
];

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
            <span className="text-3xl font-bold">{value}</span>
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

export default function MonitoringPage() {
  const [timeRange, setTimeRange] = useState("24h");

  const { data: stats, isLoading: statsLoading, refetch, isFetching } = useQuery<MonitoringStats>({
    queryKey: ["/api/monitoring/stats", { range: timeRange }],
  });

  const { data: timeSeries, isLoading: timeSeriesLoading } = useQuery<TimeSeriesData[]>({
    queryKey: ["/api/monitoring/timeseries", { range: timeRange }],
  });

  const { data: serviceStats, isLoading: serviceStatsLoading } = useQuery<ServiceStats[]>({
    queryKey: ["/api/monitoring/services", { range: timeRange }],
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const mockTimeSeries: TimeSeriesData[] = Array.from({ length: 24 }, (_, i) => ({
    timestamp: `${i}:00`,
    requests: Math.floor(Math.random() * 1000) + 100,
    responseTime: Math.floor(Math.random() * 200) + 50,
    errors: Math.floor(Math.random() * 50),
  }));

  const mockServiceStats: ServiceStats[] = services?.slice(0, 5).map((s, i) => ({
    serviceId: s.id,
    serviceName: s.name,
    requests: Math.floor(Math.random() * 5000) + 500,
    avgResponseTime: Math.floor(Math.random() * 150) + 30,
    errorRate: Math.random() * 5,
  })) || [];

  const chartData = timeSeries || mockTimeSeries;
  const serviceData = serviceStats || mockServiceStats;

  const pieData = serviceData.map((s, i) => ({
    name: s.serviceName,
    value: s.requests,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Real-time metrics and performance analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]" data-testid="select-time-range">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} data-testid="button-refresh-stats">
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={stats?.totalRequests?.toLocaleString() ?? "0"}
          description={`In the last ${timeRange}`}
          icon={Activity}
          trend={stats?.requestsTrend}
          loading={statsLoading}
        />
        <StatCard
          title="Avg Response Time"
          value={`${stats?.avgResponseTime?.toFixed(0) ?? "0"}ms`}
          description="Average latency"
          icon={Clock}
          trend={stats?.responseTimeTrend}
          loading={statsLoading}
        />
        <StatCard
          title="Success Rate"
          value={`${stats?.successRate?.toFixed(1) ?? "100"}%`}
          description="2xx responses"
          icon={TrendingUp}
          loading={statsLoading}
        />
        <StatCard
          title="Error Rate"
          value={`${stats?.errorRate?.toFixed(1) ?? "0"}%`}
          description="4xx/5xx responses"
          icon={AlertCircle}
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Volume</CardTitle>
            <CardDescription>Requests over time</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Time</CardTitle>
            <CardDescription>Average response time in milliseconds</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}ms`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [`${value}ms`, "Response Time"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke="hsl(173, 58%, 39%)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Traffic by Service</CardTitle>
            <CardDescription>Request distribution across services</CardDescription>
          </CardHeader>
          <CardContent>
            {serviceStatsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : pieData.length > 0 ? (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm truncate flex-1">{entry.name}</span>
                      <span className="text-sm text-muted-foreground">{entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <Server className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No service data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service Performance</CardTitle>
            <CardDescription>Response time comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {serviceStatsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : serviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(v) => `${v}ms`}
                  />
                  <YAxis
                    type="category"
                    dataKey="serviceName"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [`${value}ms`, "Avg Response Time"]}
                  />
                  <Bar dataKey="avgResponseTime" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <Activity className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No performance data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
