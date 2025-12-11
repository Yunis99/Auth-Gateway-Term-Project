import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Server,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Service } from "@shared/schema";

const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  baseUrl: z.string().url("Must be a valid URL"),
  description: z.string().optional(),
  healthCheckPath: z.string().optional(),
  authType: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

function ServiceCard({ service }: { service: Service }) {
  const { toast } = useToast();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/services/${service.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service deleted", description: `${service.name} has been removed` });
      setIsDeleteOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/services/${service.id}`, {
        isActive: !service.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: service.isActive ? "Service disabled" : "Service enabled",
        description: `${service.name} is now ${service.isActive ? "inactive" : "active"}`,
      });
    },
  });

  return (
    <Card className="group">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{service.name}</CardTitle>
              <Badge variant={service.isActive ? "secondary" : "destructive"} className="text-xs">
                {service.isActive ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" /> Inactive
                  </>
                )}
              </Badge>
            </div>
            <CardDescription className="mt-1 truncate">{service.description || "No description"}</CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`service-menu-${service.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toggleMutation.mutate()}>
              {service.isActive ? "Disable" : "Enable"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Base URL:</span>
            <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{service.baseUrl}</code>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Health Check:</span>
            <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{service.healthCheckPath || "/health"}</code>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Auth:</span>
            <Badge variant="outline" className="text-xs capitalize">{service.authType || "None"}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" asChild>
            <a href={service.baseUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </a>
          </Button>
        </div>
      </CardContent>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{service.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function ServicesPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      baseUrl: "",
      description: "",
      healthCheckPath: "/health",
      authType: "none",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      await apiRequest("POST", "/api/services", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Service created", description: "New service has been registered" });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create service",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Services</h1>
          <p className="text-sm text-muted-foreground">
            Manage your registered backend services
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-service">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register New Service</DialogTitle>
              <DialogDescription>
                Add a backend service to route requests through the API Gateway
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., User Service" data-testid="input-service-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="baseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://api.example.com" data-testid="input-service-url" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this service does..."
                          className="resize-none"
                          data-testid="input-service-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="healthCheckPath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Health Check Path</FormLabel>
                        <FormControl>
                          <Input placeholder="/health" data-testid="input-health-path" {...field} />
                        </FormControl>
                        <FormDescription>Endpoint to check service health</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="authType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authentication Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-auth-type">
                              <SelectValue placeholder="Select auth type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="api_key">API Key</SelectItem>
                            <SelectItem value="bearer">Bearer Token</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-service">
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Register Service
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : services && services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Server className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No services registered</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Register your backend services to route API requests through the gateway with authentication and rate limiting.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-add-first-service">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Service
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
