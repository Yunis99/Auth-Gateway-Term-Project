import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Clock,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ApiKey } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const apiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  rateLimit: z.number().min(1).max(100000).optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

function ApiKeyRow({
  apiKey,
  onDelete,
}: {
  apiKey: ApiKey;
  onDelete: (id: string) => void;
}) {
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey.keyPrefix + "...");
    toast({ title: "Copied", description: "API key prefix copied to clipboard" });
  };

  return (
    <TableRow data-testid={`api-key-row-${apiKey.id}`}>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="font-medium">{apiKey.name}</span>
          <span className="text-xs text-muted-foreground">
            Created {formatDistanceToNow(new Date(apiKey.createdAt), { addSuffix: true })}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
            {apiKey.keyPrefix}...
          </code>
          <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-7 w-7">
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={apiKey.isActive ? "secondary" : "destructive"} className="text-xs">
          {apiKey.isActive ? (
            <>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Active
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" /> Revoked
            </>
          )}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm">{apiKey.rateLimit?.toLocaleString() || "Unlimited"}/hr</span>
      </TableCell>
      <TableCell>
        {apiKey.lastUsedAt ? (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(apiKey.lastUsedAt), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Never used</span>
        )}
      </TableCell>
      <TableCell>
        {apiKey.expiresAt ? (
          <span className="text-sm">
            {new Date(apiKey.expiresAt) < new Date() ? (
              <Badge variant="destructive" className="text-xs">Expired</Badge>
            ) : (
              formatDistanceToNow(new Date(apiKey.expiresAt), { addSuffix: true })
            )}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Never</span>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`key-menu-${apiKey.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Key Prefix
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(apiKey.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Revoke Key
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<string | null>(null);

  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
      rateLimit: 1000,
      expiresInDays: 30,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: ApiKeyFormValues) => {
      const response = await apiRequest("POST", "/api/api-keys", values);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setNewKeyValue(data.key);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({ title: "API key revoked", description: "The key can no longer be used" });
      setIsDeleteOpen(null);
    },
  });

  const copyNewKey = () => {
    if (newKeyValue) {
      navigator.clipboard.writeText(newKeyValue);
      toast({ title: "Copied", description: "API key copied to clipboard" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">API Keys</h1>
          <p className="text-sm text-muted-foreground">
            Manage API keys for programmatic access to services
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setNewKeyValue(null);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-key">
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {newKeyValue ? (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>
                    Copy your API key now. You won't be able to see it again.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-md">
                    <code className="font-mono text-sm break-all" data-testid="new-api-key">
                      {newKeyValue}
                    </code>
                  </div>
                  <Button onClick={copyNewKey} className="w-full" data-testid="button-copy-key">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsCreateOpen(false);
                    setNewKeyValue(null);
                  }}>
                    Done
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key for authenticating requests
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Production API Key" data-testid="input-key-name" {...field} />
                          </FormControl>
                          <FormDescription>A descriptive name to identify this key</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rateLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate Limit (per hour)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1000"
                              data-testid="input-rate-limit"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                            />
                          </FormControl>
                          <FormDescription>Maximum requests allowed per hour</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expiresInDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expires In (days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="30"
                              data-testid="input-expires-days"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                            />
                          </FormControl>
                          <FormDescription>Leave empty for no expiration</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-key">
                        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Create Key
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : apiKeys && apiKeys.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <ApiKeyRow
                    key={key.id}
                    apiKey={key}
                    onDelete={(id) => setIsDeleteOpen(id)}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Key className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No API keys yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                Create API keys to authenticate programmatic access to your services through the gateway.
              </p>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-key">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First API Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!isDeleteOpen} onOpenChange={() => setIsDeleteOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone and any applications using this key will lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => isDeleteOpen && deleteMutation.mutate(isDeleteOpen)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
