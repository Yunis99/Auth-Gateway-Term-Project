import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Users,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Loader2,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

function UserRow({ user, currentUserId }: { user: User; currentUserId?: string }) {
  const { toast } = useToast();
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);

  const isCurrentUser = user.id === currentUserId;

  const updateRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      await apiRequest("PATCH", `/api/admin/users/${user.id}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Role updated", description: `${user.username} is now a ${selectedRole}` });
      setIsRoleDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/admin/users/${user.id}`, { isActive: !user.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: user.isActive ? "User deactivated" : "User activated",
        description: `${user.username} has been ${user.isActive ? "deactivated" : "activated"}`,
      });
      setIsToggleDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    },
  });

  return (
    <>
      <TableRow data-testid={`user-row-${user.id}`}>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.username}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
            {user.role === "admin" ? (
              <>
                <ShieldCheck className="h-3 w-3 mr-1" /> Admin
              </>
            ) : (
              <>
                <Shield className="h-3 w-3 mr-1" /> User
              </>
            )}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant={user.isActive ? "secondary" : "destructive"} className="text-xs">
            {user.isActive ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Active
              </>
            ) : (
              <>
                <Ban className="h-3 w-3 mr-1" /> Inactive
              </>
            )}
          </Badge>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
          </span>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isCurrentUser} data-testid={`user-menu-${user.id}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsRoleDialogOpen(true)}>
                <Shield className="h-4 w-4 mr-2" />
                Change Role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={user.isActive ? "text-destructive" : ""}
                onClick={() => setIsToggleDialogOpen(true)}
              >
                {user.isActive ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {user.username}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger data-testid="select-user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateRoleMutation.mutate(selectedRole)}
              disabled={updateRoleMutation.isPending || selectedRole === user.role}
            >
              {updateRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user.isActive ? "Deactivate" : "Activate"} User</DialogTitle>
            <DialogDescription>
              {user.isActive
                ? `Are you sure you want to deactivate ${user.username}? They will no longer be able to access the system.`
                : `Activate ${user.username} to restore their access to the system.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsToggleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={user.isActive ? "destructive" : "default"}
              onClick={() => toggleActiveMutation.mutate()}
              disabled={toggleActiveMutation.isPending}
            >
              {toggleActiveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {user.isActive ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const filteredUsers = users?.filter((user) => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (
        !user.username.toLowerCase().includes(searchLower) &&
        !user.email.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (roleFilter !== "all" && user.role !== roleFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-role-filter">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <UserRow key={user.id} user={user} currentUserId={currentUser?.id} />
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {search || roleFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Users will appear here as they register."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
