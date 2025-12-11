import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ScrollText,
  Filter,
  Download,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { queryClient } from "@/lib/queryClient";
import type { RequestLog } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";

const methodColors: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  POST: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PUT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PATCH: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function LogRow({ log }: { log: RequestLog }) {
  const [isOpen, setIsOpen] = useState(false);

  const statusColor =
    log.statusCode && log.statusCode >= 200 && log.statusCode < 300
      ? "text-green-600 dark:text-green-400"
      : log.statusCode && log.statusCode >= 400
      ? "text-red-600 dark:text-red-400"
      : "text-yellow-600 dark:text-yellow-400";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div
          className="flex items-center gap-4 p-4 border-b border-border hover-elevate cursor-pointer"
          data-testid={`log-row-${log.id}`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Badge className={`text-xs font-mono shrink-0 ${methodColors[log.method] || "bg-muted"}`}>
              {log.method}
            </Badge>
            <span className="font-mono text-sm truncate">{log.path}</span>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <span className={`font-mono text-sm font-medium ${statusColor}`}>
              {log.statusCode || "---"}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1 w-20">
              <Clock className="h-3 w-3" />
              {log.responseTime}ms
            </span>
            <span className="text-xs text-muted-foreground w-32 text-right">
              {format(new Date(log.createdAt), "HH:mm:ss")}
            </span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 bg-muted/30 border-b border-border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Request Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground">IP:</span>
                  <span className="font-mono">{log.ipAddress || "Unknown"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">User Agent:</span>
                  <span className="font-mono text-xs truncate max-w-xs">{log.userAgent || "Unknown"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">Time:</span>
                  <span>{format(new Date(log.createdAt), "PPpp")}</span>
                </div>
              </div>
            </div>
            {log.error && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Error</h4>
                <pre className="text-xs font-mono bg-destructive/10 text-destructive p-2 rounded overflow-auto max-h-32">
                  {log.error}
                </pre>
              </div>
            )}
          </div>
          {log.requestBody && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Request Body</h4>
              <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-32">
                {typeof log.requestBody === "string"
                  ? log.requestBody
                  : JSON.stringify(log.requestBody, null, 2)}
              </pre>
            </div>
          )}
          {log.responseBody && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Response Body</h4>
              <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-32">
                {typeof log.responseBody === "string"
                  ? log.responseBody
                  : JSON.stringify(log.responseBody, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function LogsPage() {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: logs, isLoading, refetch, isFetching } = useQuery<RequestLog[]>({
    queryKey: ["/api/logs", { search, method: methodFilter, status: statusFilter }],
  });

  const filteredLogs = logs?.filter((log) => {
    if (search && !log.path.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (methodFilter !== "all" && log.method !== methodFilter) {
      return false;
    }
    if (statusFilter === "success" && (log.statusCode! < 200 || log.statusCode! >= 300)) {
      return false;
    }
    if (statusFilter === "error" && log.statusCode! < 400) {
      return false;
    }
    return true;
  });

  const exportLogs = () => {
    if (!filteredLogs) return;
    const csv = [
      ["Timestamp", "Method", "Path", "Status", "Response Time", "IP"],
      ...filteredLogs.map((log) => [
        format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        log.method,
        log.path,
        log.statusCode?.toString() || "",
        log.responseTime?.toString() || "",
        log.ipAddress || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Request Logs</h1>
          <p className="text-sm text-muted-foreground">
            View and analyze API gateway request history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} data-testid="button-refresh-logs">
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportLogs} disabled={!filteredLogs?.length} data-testid="button-export-logs">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by path..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-logs"
              />
            </div>
            <div className="flex gap-2">
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[120px]" data-testid="select-method-filter">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div>
              {filteredLogs.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <ScrollText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No logs found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {search || methodFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Request logs will appear here as API calls are made through the gateway."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
