import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Search, MoreHorizontal, Edit, Key, UserX, UserCheck, Trash2 } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from '../../lib/api';
import type { AdminUser, PaginatedUsers, UserCreateData, UserUpdateData } from '../../lib/api';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Alert, AlertDescription } from '../../components/ui/alert';

// User Form Modal Component
interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserCreateData | UserUpdateData) => Promise<void>;
  user?: AdminUser | null;
  mode: 'create' | 'edit';
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSubmit, user, mode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: '',
    role: 'user' as 'user' | 'admin',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        email: user.email,
        password: '',
        username: user.username || '',
        displayName: user.displayName || '',
        role: user.role,
      });
    } else {
      setFormData({
        email: '',
        password: '',
        username: '',
        displayName: '',
        role: 'user',
      });
    }
    setError(null);
  }, [user, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'create') {
        await onSubmit({
          email: formData.email,
          password: formData.password,
          username: formData.username || undefined,
          displayName: formData.displayName || undefined,
          role: formData.role,
        });
      } else {
        await onSubmit({
          username: formData.username || undefined,
          displayName: formData.displayName || undefined,
          role: formData.role,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create User' : 'Edit User'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Add a new user to the system.' : 'Update user details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={mode === 'edit'}
              required={mode === 'create'}
            />
          </div>

          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value as 'user' | 'admin' })}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} loading={loading}>
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Reset Password Modal
interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
  user: AdminUser | null;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, onSubmit, user }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPassword('');
    setConfirmPassword('');
    setError(null);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(password);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Reset password for <strong>{user.email}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} loading={loading}>
              Reset Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main AdminUsers Component
export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const sortBy = sorting[0]?.id || 'createdAt';
      const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
      
      const data = await getUsers({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        search: search || undefined,
        sortBy,
        sortOrder,
      });
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [pagination.pageIndex, pagination.pageSize, sorting]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreateUser = async (data: UserCreateData | UserUpdateData) => {
    await createUser(data as UserCreateData);
    await loadUsers();
  };

  const handleUpdateUser = async (data: UserCreateData | UserUpdateData) => {
    if (selectedUser) {
      await updateUser(selectedUser.id, data as UserUpdateData);
      await loadUsers();
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (confirm(`Are you sure you want to deactivate ${user.email}?`)) {
      await deleteUser(user.id);
      await loadUsers();
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    await updateUser(user.id, { isActive: !user.isActive });
    await loadUsers();
  };

  const handleResetPassword = async (password: string) => {
    if (selectedUser) {
      await resetUserPassword(selectedUser.id, password);
    }
  };

  const columns = useMemo<ColumnDef<AdminUser>[]>(() => [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.email}</div>
          {row.original.username && (
            <div className="text-sm text-muted-foreground">@{row.original.username}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'displayName',
      header: 'Display Name',
      cell: ({ row }) => row.original.displayName || '-',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant={row.original.role === 'admin' ? 'default' : 'secondary'}>
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: 'provider',
      header: 'Provider',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground capitalize">
          {row.original.provider}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'destructive'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) => row.original.lastLoginAt 
        ? new Date(row.original.lastLoginAt).toLocaleDateString()
        : 'Never',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setModalMode('edit');
                  setShowUserModal(true);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {user.provider === 'local' && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUser(user);
                    setShowResetPasswordModal(true);
                  }}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Reset Password
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                {user.isActive ? (
                  <>
                    <UserX className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDeleteUser(user)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">
            User Management
          </h2>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setModalMode('create');
            setShowUserModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by email, username, or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <DataTable
          columns={columns}
          data={users?.data || []}
          pageCount={users?.totalPages || 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          isLoading={loading}
          manualPagination
          manualSorting
        />
      </div>

      {/* Total count */}
      {users && (
        <div className="text-sm text-muted-foreground">
          <Users className="w-4 h-4 inline-block mr-1" />
          {users.total} total users
        </div>
      )}

      {/* Modals */}
      <UserFormModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSubmit={modalMode === 'create' ? handleCreateUser : handleUpdateUser}
        user={selectedUser}
        mode={modalMode}
      />

      <ResetPasswordModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        onSubmit={handleResetPassword}
        user={selectedUser}
      />
    </div>
  );
};
