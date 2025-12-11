import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Send,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Service } from "@shared/schema";

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
}

const methodColors: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  POST: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PUT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PATCH: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function ApiTesterPage() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<Header[]>([
    { key: "Content-Type", value: "application/json", enabled: true },
  ]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const sendRequest = useMutation({
    mutationFn: async () => {
      const startTime = performance.now();

      const requestHeaders: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.enabled && h.key) {
          requestHeaders[h.key] = h.value;
        }
      });

      if (token) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
      }

      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
      };

      if (method !== "GET" && method !== "HEAD" && body) {
        fetchOptions.body = body;
      }

      const res = await fetch(url.startsWith("http") ? url : `/api${url.startsWith("/") ? url : "/" + url}`, fetchOptions);
      const endTime = performance.now();

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let responseBody = "";
      try {
        const text = await res.text();
        try {
          responseBody = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          responseBody = text;
        }
      } catch {
        responseBody = "Unable to parse response";
      }

      return {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: Math.round(endTime - startTime),
      };
    },
    onSuccess: (data) => {
      setResponse(data);
    },
    onError: (error) => {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Network error",
        variant: "destructive",
      });
    },
  });

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "", enabled: true }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const copyResponse = () => {
    if (response?.body) {
      navigator.clipboard.writeText(response.body);
      toast({ title: "Copied", description: "Response copied to clipboard" });
    }
  };

  const statusColor =
    response?.status && response.status >= 200 && response.status < 300
      ? "text-green-600 dark:text-green-400"
      : response?.status && response.status >= 400
      ? "text-red-600 dark:text-red-400"
      : "text-yellow-600 dark:text-yellow-400";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">API Tester</h1>
        <p className="text-sm text-muted-foreground">
          Test your API endpoints through the gateway
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request</CardTitle>
            <CardDescription>Configure and send your API request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-[120px]" data-testid="select-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                    <SelectItem key={m} value={m}>
                      <Badge className={`${methodColors[m]} font-mono`}>{m}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="/users or https://api.example.com/users"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="font-mono text-sm"
                data-testid="input-url"
              />
              <Button
                onClick={() => sendRequest.mutate()}
                disabled={!url || sendRequest.isPending}
                data-testid="button-send"
              >
                {sendRequest.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>

            {services && services.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Quick select:</span>
                {services.map((s) => (
                  <Button
                    key={s.id}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setUrl(s.baseUrl)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            )}

            <Tabs defaultValue="headers">
              <TabsList>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="auth">Auth</TabsTrigger>
              </TabsList>

              <TabsContent value="headers" className="space-y-2 mt-4">
                {headers.map((header, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => updateHeader(i, "enabled", e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Input
                      placeholder="Header name"
                      value={header.key}
                      onChange={(e) => updateHeader(i, "key", e.target.value)}
                      className="font-mono text-xs"
                      data-testid={`input-header-key-${i}`}
                    />
                    <Input
                      placeholder="Value"
                      value={header.value}
                      onChange={(e) => updateHeader(i, "value", e.target.value)}
                      className="font-mono text-xs"
                      data-testid={`input-header-value-${i}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHeader(i)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addHeader} data-testid="button-add-header">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Header
                </Button>
              </TabsContent>

              <TabsContent value="body" className="mt-4">
                <Textarea
                  placeholder='{"key": "value"}'
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="font-mono text-sm min-h-[200px]"
                  data-testid="input-body"
                />
              </TabsContent>

              <TabsContent value="auth" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Authorization Header</Label>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <code className="font-mono text-xs break-all">
                        {token ? `Bearer ${token.substring(0, 30)}...` : "Not authenticated"}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Your JWT token is automatically included in requests
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Response</CardTitle>
              <CardDescription>
                {response ? (
                  <span className="flex items-center gap-2">
                    <span className={`font-mono font-medium ${statusColor}`}>
                      {response.status} {response.statusText}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {response.time}ms
                    </span>
                  </span>
                ) : (
                  "Send a request to see the response"
                )}
              </CardDescription>
            </div>
            {response && (
              <Button variant="ghost" size="icon" onClick={copyResponse}>
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {sendRequest.isPending ? (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Sending request...</p>
              </div>
            ) : response ? (
              <Tabs defaultValue="body">
                <TabsList>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                </TabsList>

                <TabsContent value="body" className="mt-4">
                  <pre className="font-mono text-xs bg-muted p-4 rounded-md overflow-auto max-h-[400px]" data-testid="response-body">
                    {response.body || "No content"}
                  </pre>
                </TabsContent>

                <TabsContent value="headers" className="mt-4">
                  <div className="space-y-2">
                    {Object.entries(response.headers).map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-sm">
                        <span className="font-mono text-muted-foreground">{key}:</span>
                        <span className="font-mono break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <Send className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No response yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Enter a URL and click Send to make a request through the API Gateway
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
