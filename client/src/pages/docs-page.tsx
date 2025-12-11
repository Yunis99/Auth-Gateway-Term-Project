import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Key,
  Shield,
  Server,
  Activity,
  Copy,
  ChevronRight,
  Code,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Service } from "@shared/schema";

interface Endpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  body?: string;
  response?: string;
}

const authEndpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/register",
    description: "Register a new user account",
    auth: false,
    body: `{
  "username": "string",
  "email": "string",
  "password": "string"
}`,
    response: `{
  "user": { "id": "...", "username": "...", "email": "...", "role": "user" },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}`,
  },
  {
    method: "POST",
    path: "/api/login",
    description: "Authenticate and receive JWT tokens",
    auth: false,
    body: `{
  "username": "string",
  "password": "string"
}`,
    response: `{
  "user": { "id": "...", "username": "...", "email": "...", "role": "user" },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}`,
  },
  {
    method: "POST",
    path: "/api/refresh",
    description: "Refresh access token using refresh token",
    auth: false,
    body: `{
  "refreshToken": "jwt_refresh_token"
}`,
    response: `{
  "accessToken": "new_jwt_access_token",
  "refreshToken": "new_jwt_refresh_token"
}`,
  },
  {
    method: "GET",
    path: "/api/user",
    description: "Get current authenticated user",
    auth: true,
    response: `{
  "id": "user_id",
  "username": "string",
  "email": "string",
  "role": "user | admin"
}`,
  },
];

const serviceEndpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/api/services",
    description: "List all registered services",
    auth: true,
    response: `[
  {
    "id": "service_id",
    "name": "User Service",
    "baseUrl": "https://api.example.com",
    "isActive": true,
    "healthCheckPath": "/health",
    "authType": "bearer"
  }
]`,
  },
  {
    method: "POST",
    path: "/api/services",
    description: "Register a new backend service",
    auth: true,
    body: `{
  "name": "Service Name",
  "baseUrl": "https://api.example.com",
  "description": "Optional description",
  "healthCheckPath": "/health",
  "authType": "none | api_key | bearer"
}`,
  },
  {
    method: "DELETE",
    path: "/api/services/:id",
    description: "Delete a registered service",
    auth: true,
  },
];

const apiKeyEndpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/api/api-keys",
    description: "List all API keys for current user",
    auth: true,
    response: `[
  {
    "id": "key_id",
    "name": "Production Key",
    "keyPrefix": "sk_live_",
    "isActive": true,
    "rateLimit": 1000,
    "lastUsedAt": "2024-01-01T00:00:00Z"
  }
]`,
  },
  {
    method: "POST",
    path: "/api/api-keys",
    description: "Create a new API key",
    auth: true,
    body: `{
  "name": "Key Name",
  "rateLimit": 1000,
  "expiresInDays": 30
}`,
    response: `{
  "id": "key_id",
  "key": "sk_live_xxxxxxxxxxxxx",
  "name": "Key Name"
}`,
  },
  {
    method: "DELETE",
    path: "/api/api-keys/:id",
    description: "Revoke an API key",
    auth: true,
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  POST: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PUT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PATCH: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: "Code copied to clipboard" });
  };

  const curlExample = `curl -X ${endpoint.method} "https://your-gateway.com${endpoint.path}" \\
  ${endpoint.auth ? '-H "Authorization: Bearer YOUR_TOKEN" \\' : ""}
  -H "Content-Type: application/json"${endpoint.body ? ` \\
  -d '${endpoint.body.replace(/\n/g, "").replace(/\s+/g, " ")}'` : ""}`;

  const jsExample = `const response = await fetch("${endpoint.path}", {
  method: "${endpoint.method}",
  headers: {
    "Content-Type": "application/json",${endpoint.auth ? '\n    "Authorization": "Bearer YOUR_TOKEN"' : ""}
  }${endpoint.body ? `,
  body: JSON.stringify(${endpoint.body.replace(/\n/g, "").replace(/\s+/g, " ")})` : ""}
});
const data = await response.json();`;

  return (
    <Card className="group">
      <div
        className="p-4 cursor-pointer hover-elevate"
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid={`endpoint-${endpoint.method}-${endpoint.path.replace(/\//g, "-")}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Badge className={`font-mono text-xs ${methodColors[endpoint.method]}`}>
              {endpoint.method}
            </Badge>
            <code className="font-mono text-sm">{endpoint.path}</code>
            {endpoint.auth && (
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" /> Auth
              </Badge>
            )}
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
        </div>
        <p className="text-sm text-muted-foreground mt-2">{endpoint.description}</p>
      </div>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          <Tabs defaultValue="curl">
            <TabsList>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            </TabsList>
            <TabsContent value="curl" className="relative mt-4">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => copyCode(curlExample)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <pre className="font-mono text-xs bg-muted p-4 rounded-md overflow-auto">
                {curlExample}
              </pre>
            </TabsContent>
            <TabsContent value="javascript" className="relative mt-4">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => copyCode(jsExample)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <pre className="font-mono text-xs bg-muted p-4 rounded-md overflow-auto">
                {jsExample}
              </pre>
            </TabsContent>
          </Tabs>

          {endpoint.body && (
            <div>
              <h4 className="text-sm font-medium mb-2">Request Body</h4>
              <pre className="font-mono text-xs bg-muted p-4 rounded-md overflow-auto">
                {endpoint.body}
              </pre>
            </div>
          )}

          {endpoint.response && (
            <div>
              <h4 className="text-sm font-medium mb-2">Response</h4>
              <pre className="font-mono text-xs bg-muted p-4 rounded-md overflow-auto">
                {endpoint.response}
              </pre>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function SideNavItem({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  return (
    <div className="flex h-full">
      <div className="w-56 shrink-0 border-r border-border p-4">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Documentation
          </h3>
          <SideNavItem
            icon={BookOpen}
            label="Overview"
            isActive={activeSection === "overview"}
            onClick={() => setActiveSection("overview")}
          />
          <SideNavItem
            icon={Shield}
            label="Authentication"
            isActive={activeSection === "auth"}
            onClick={() => setActiveSection("auth")}
          />
          <SideNavItem
            icon={Server}
            label="Services"
            isActive={activeSection === "services"}
            onClick={() => setActiveSection("services")}
          />
          <SideNavItem
            icon={Key}
            label="API Keys"
            isActive={activeSection === "keys"}
            onClick={() => setActiveSection("keys")}
          />
          <SideNavItem
            icon={Activity}
            label="Rate Limiting"
            isActive={activeSection === "rate-limit"}
            onClick={() => setActiveSection("rate-limit")}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl">
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold mb-2">API Gateway Documentation</h1>
                <p className="text-muted-foreground">
                  Complete reference for the API Gateway authentication and authorization system.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>Quick start guide for using the API Gateway</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
                      Register an Account
                    </h4>
                    <p className="text-sm text-muted-foreground pl-8">
                      Create an account using the registration endpoint or the web interface.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
                      Get Your JWT Token
                    </h4>
                    <p className="text-sm text-muted-foreground pl-8">
                      Login to receive your access and refresh tokens for API authentication.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</span>
                      Create an API Key
                    </h4>
                    <p className="text-sm text-muted-foreground pl-8">
                      Generate API keys for programmatic access to your services.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">4</span>
                      Register Services
                    </h4>
                    <p className="text-sm text-muted-foreground pl-8">
                      Add your backend services to route requests through the gateway.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Base URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="font-mono text-sm bg-muted px-3 py-2 rounded block">
                    {typeof window !== "undefined" ? window.location.origin : "https://your-gateway.com"}
                  </code>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "auth" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold mb-2">Authentication</h1>
                <p className="text-muted-foreground">
                  JWT-based authentication endpoints for user management.
                </p>
              </div>

              <div className="space-y-4">
                {authEndpoints.map((endpoint, i) => (
                  <EndpointCard key={i} endpoint={endpoint} />
                ))}
              </div>
            </div>
          )}

          {activeSection === "services" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold mb-2">Services</h1>
                <p className="text-muted-foreground">
                  Manage backend services registered with the API Gateway.
                </p>
              </div>

              <div className="space-y-4">
                {serviceEndpoints.map((endpoint, i) => (
                  <EndpointCard key={i} endpoint={endpoint} />
                ))}
              </div>
            </div>
          )}

          {activeSection === "keys" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold mb-2">API Keys</h1>
                <p className="text-muted-foreground">
                  Create and manage API keys for programmatic service access.
                </p>
              </div>

              <div className="space-y-4">
                {apiKeyEndpoints.map((endpoint, i) => (
                  <EndpointCard key={i} endpoint={endpoint} />
                ))}
              </div>
            </div>
          )}

          {activeSection === "rate-limit" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold mb-2">Rate Limiting</h1>
                <p className="text-muted-foreground">
                  Understanding rate limits and how to handle them.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Rate Limit Headers</CardTitle>
                  <CardDescription>Response headers indicating rate limit status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <code className="font-mono text-sm">X-RateLimit-Limit</code>
                    <p className="text-sm text-muted-foreground">Maximum requests allowed per hour</p>
                  </div>
                  <div className="space-y-2">
                    <code className="font-mono text-sm">X-RateLimit-Remaining</code>
                    <p className="text-sm text-muted-foreground">Requests remaining in current window</p>
                  </div>
                  <div className="space-y-2">
                    <code className="font-mono text-sm">X-RateLimit-Reset</code>
                    <p className="text-sm text-muted-foreground">Unix timestamp when the window resets</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Handling Rate Limits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    When you exceed your rate limit, the API returns a <code className="font-mono">429 Too Many Requests</code> response.
                    Implement exponential backoff or wait for the reset time.
                  </p>
                  <pre className="font-mono text-xs bg-muted p-4 rounded-md overflow-auto">
{`// Example rate limit response
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
