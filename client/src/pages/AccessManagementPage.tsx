import React, { useState, useEffect } from 'react';
import { Button, Card, CardHeader, Badge, Loading, Toggle } from '@/components/ui';
import { SearchInput } from '@/components/forms';
import { userService } from '@/services/user.service';
import { permissionService, type Role } from '@/services/permission.service';
import type { User, DashboardComponent, RoleComponentPermission } from '@/types';
import { cn } from '@/utils/cn';

type TabType = 'users' | 'roles' | 'components';

const AccessManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState<any>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<string>('');

  // Component Permissions state
  const [roles, setRoles] = useState<Role[]>([]);
  const [components, setComponents] = useState<DashboardComponent[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RoleComponentPermission[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [permissionChanges, setPermissionChanges] = useState<Map<number, { canView: boolean; canInteract: boolean }>>(new Map());
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Fetch users from database
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await userService.getAccessManagementUsers();
        
        if (response.success && response.data) {
          setUsers(response.data);
        } else {
          setError('Failed to load users');
        }
      } catch (err) {
        setError('Failed to load users. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Load roles for all tabs (needed for user role editing)
  useEffect(() => {
    const loadRoles = async () => {
      if (roles.length === 0) {
        try {
          const response = await permissionService.getRoles();
          if (response.success && response.data) {
            setRoles(response.data);
          }
        } catch (error) {
          // Failed to load roles - will retry on next mount
        }
      }
    };

    loadRoles();
  }, []);

  // Load dashboard components when switching to components tab
  useEffect(() => {
    const loadComponents = async () => {
      if (activeTab === 'components') {
        try {
          setIsLoadingPermissions(true);
          const response = await permissionService.getDashboardComponents();
          if (response.success && response.data) {
            setComponents(response.data);
          }
        } catch (error) {
          // Failed to load components
        } finally {
          setIsLoadingPermissions(false);
        }
      }
    };

    loadComponents();
  }, [activeTab]);

  // Load role permissions when role is selected
  useEffect(() => {
    const loadRolePermissions = async () => {
      if (selectedRoleId) {
        try {
          setIsLoadingPermissions(true);
          const response = await permissionService.getRolePermissions(selectedRoleId);
          if (response.success && response.data) {
            setRolePermissions(response.data);
            // Clear unsaved changes
            setPermissionChanges(new Map());
          }
        } catch (error) {
          // Failed to load role permissions
        } finally {
          setIsLoadingPermissions(false);
        }
      }
    };

    loadRolePermissions();
  }, [selectedRoleId]);

  // Permission change handlers
  const handlePermissionToggle = (componentId: number, field: 'canView' | 'canInteract', value: boolean) => {
    const currentPerm = rolePermissions.find(p => p.component_id === componentId);
    const existingChange = permissionChanges.get(componentId);
    
    const newChange = {
      canView: existingChange?.canView ?? currentPerm?.can_view ?? false,
      canInteract: existingChange?.canInteract ?? currentPerm?.can_interact ?? false,
      [field]: value,
    };
    
    // If turning off view, also turn off interact
    if (field === 'canView' && !value) {
      newChange.canInteract = false;
    }
    
    const newChanges = new Map(permissionChanges);
    newChanges.set(componentId, newChange);
    setPermissionChanges(newChanges);
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;

    try {
      setIsLoadingPermissions(true);
      
      // Merge current permissions with changes
      const updatedPermissions = rolePermissions.map(perm => {
        const change = permissionChanges.get(perm.component_id);
        return {
          componentId: perm.component_id,
          canView: change?.canView ?? perm.can_view,
          canInteract: change?.canInteract ?? perm.can_interact,
        };
      });

      const response = await permissionService.updateRolePermissions(selectedRoleId, {
        permissions: updatedPermissions
      });

      if (response.success) {
        // Reload permissions to show saved state
        const reloadResponse = await permissionService.getRolePermissions(selectedRoleId);
        if (reloadResponse.success && reloadResponse.data) {
          setRolePermissions(reloadResponse.data);
          setPermissionChanges(new Map());
          alert('Permissions saved successfully!');
        }
      }
    } catch (error) {
      alert('Failed to save permissions. Please try again.');
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const handleResetChanges = () => {
    setPermissionChanges(new Map());
  };

  // Select All / Deselect All handlers
  const handleSelectAllView = (value: boolean) => {
    const newChanges = new Map(permissionChanges);
    filteredComponents.forEach(component => {
      const existingChange = newChanges.get(component.id);
      const currentPerm = rolePermissions.find(p => p.component_id === component.id);
      
      newChanges.set(component.id, {
        canView: value,
        canInteract: value ? (existingChange?.canInteract ?? currentPerm?.can_interact ?? false) : false,
      });
    });
    setPermissionChanges(newChanges);
  };

  const handleSelectAllInteract = (value: boolean) => {
    const newChanges = new Map(permissionChanges);
    filteredComponents.forEach(component => {
      const existingChange = newChanges.get(component.id);
      const currentPerm = rolePermissions.find(p => p.component_id === component.id);
      const currentCanView = existingChange?.canView ?? currentPerm?.can_view ?? false;
      
      // Only allow interaction if view is enabled
      if (currentCanView) {
        newChanges.set(component.id, {
          canView: currentCanView,
          canInteract: value,
        });
      }
    });
    setPermissionChanges(newChanges);
  };

  // Handle Google Group Sync
  const handleSyncGoogleGroup = async () => {
    try {
      setIsSyncing(true);
      const response = await userService.syncGoogleGroup();
      
      if (response.success && response.data) {
        setSyncStats(response.data.stats);
        setLastSyncTime(response.data.timestamp);
        
        // Refresh users list
        const usersResponse = await userService.getAccessManagementUsers();
        if (usersResponse.success && usersResponse.data) {
          setUsers(usersResponse.data);
        }
        
        alert(`Sync completed!\nAdded: ${response.data.stats.newUsersAdded}\nReactivated: ${response.data.stats.usersReactivated}\nDeactivated: ${response.data.stats.usersDeactivated}`);
      }
    } catch (error) {
      alert('Failed to sync with Google Group');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle edit user role
  const handleStartEditRole = (userId: number, currentRole: string) => {
    setEditingUserId(userId);
    setEditingRole(currentRole);
  };

  const handleCancelEditRole = () => {
    setEditingUserId(null);
    setEditingRole('');
  };

  // Handle user role change
  const handleSaveRoleChange = async (userEmail: string) => {
    try {
      const response = await fetch('/api/access-management/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: userEmail,
          role: editingRole
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.email === userEmail ? { ...u, role: editingRole } : u
          )
        );
        alert(`User role updated successfully to ${editingRole}`);
        setEditingUserId(null);
        setEditingRole('');
      } else {
        alert(`Failed to update user role: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to update user role');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get filtered components based on category
  const filteredComponents = components.filter(comp => 
    filterCategory === 'all' || comp.category === filterCategory
  );

  // Get current permission value (either from changes or original)
  const getPermissionValue = (componentId: number, field: 'canView' | 'canInteract'): boolean => {
    const change = permissionChanges.get(componentId);
    if (change) {
      return field === 'canView' ? change.canView : change.canInteract;
    }
    const perm = rolePermissions.find(p => p.component_id === componentId);
    return field === 'canView' ? (perm?.can_view ?? false) : (perm?.can_interact ?? false);
  };

  // Check if all filtered components have view/interact enabled
  const areAllViewEnabled = filteredComponents.every(comp => 
    getPermissionValue(comp.id, 'canView')
  );
  
  const areAllInteractEnabled = filteredComponents.every(comp => {
    const canView = getPermissionValue(comp.id, 'canView');
    return canView && getPermissionValue(comp.id, 'canInteract');
  });

  // Check if there are unsaved changes
  const hasUnsavedChanges = permissionChanges.size > 0;

  // Get unique categories
  const categories = ['all', ...new Set(components.map(c => c.category).filter(Boolean))];

  // Get unique role list for dropdown
  const uniqueRoles = Array.from(new Set(users.map(u => u.role))).sort();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'top_management':
        return 'warning';
      case 'department_director':
        return 'info';
      default:
        return 'default';
    }
  };

  const roleCounts = {
    all: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    team: users.filter(u => u.role === 'team').length,
    department_director: users.filter(u => u.role === 'department_director').length,
    top_management: users.filter(u => u.role === 'top_management').length,
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <div className="text-center p-8">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Users</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Access Management</h1>
          <p className="text-gray-600 mt-1">Manage users, roles, and component permissions</p>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'px-6 py-3 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'users'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={cn(
              'px-6 py-3 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'roles'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Roles ({uniqueRoles.length})
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={cn(
              'px-6 py-3 font-medium text-sm border-b-2 transition-colors',
              activeTab === 'components'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            Component Permissions
          </button>
        </div>
      </Card>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card variant="elevated" padding="sm">
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{roleCounts.all}</p>
            <p className="text-sm text-gray-600 mt-1">Total Users</p>
          </div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{roleCounts.admin}</p>
            <p className="text-sm text-gray-600 mt-1">Admins</p>
          </div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{roleCounts.team}</p>
            <p className="text-sm text-gray-600 mt-1">Team Members</p>
          </div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{roleCounts.department_director}</p>
            <p className="text-sm text-gray-600 mt-1">Directors</p>
          </div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{roleCounts.top_management}</p>
            <p className="text-sm text-gray-600 mt-1">Executives</p>
          </div>
        </Card>
      </div>

      {/* Filters and Sync */}
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1">
            <SearchInput
              placeholder="Search users..."
              onSearch={setSearchTerm}
            />
          </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSyncGoogleGroup}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync with Google Group
                </>
              )}
            </Button>
          </div>
          
          {lastSyncTime && (
            <div className="text-xs text-gray-500">
              Last sync: {new Date(lastSyncTime).toLocaleString()} 
              {syncStats && ` (${syncStats.activeUsers} active users)`}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            <div className="text-sm font-medium text-gray-700 mr-2 flex items-center">Role:</div>
            {['all', 'admin', 'team', 'team_manager', 'management', 'department_director', 'top_management', 'VP', 'auditor', 'ceo'].map((role) => (
              <Button
                key={role}
                variant={filterRole === role ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterRole(role)}
              >
                {role === 'all' ? 'All' : role.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Button>
            ))}
          </div>          
          <div className="flex flex-wrap gap-2">
            <div className="text-sm font-medium text-gray-700 mr-2 flex items-center">Status:</div>
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card variant="elevated">
        <CardHeader title="Users" subtitle={`${filteredUsers.length} users found`} />
        <div className="overflow-x-auto mt-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Login</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{user.email}</td>
                  <td className="py-4 px-4">
                    {editingUserId === user.id ? (
                      <select
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.name}>
                            {role.name.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </option>
                        ))}
                      </select>
                    ) : (
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role.replace('_', ' ')}
                    </Badge>
                    )}
                  </td>
                  <td className="py-4 px-4 text-gray-600">{user.department || '-'}</td>
                  <td className="py-4 px-4">
                    <Badge variant={user.status === 'active' ? 'success' : 'default'}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      {editingUserId === user.id ? (
                        <>
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => handleSaveRoleChange(user.email)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleCancelEditRole}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleStartEditRole(user.id, user.role)}
                          >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <>
          {/* Roles Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {uniqueRoles.map((roleName) => {
              const roleUsers = users.filter(u => u.role === roleName);
              const roleFromDB = roles.find(r => r.name === roleName);
              
              return (
                <Card key={roleName} variant="elevated" padding="sm">
                  <div className="text-center">
                    <Badge variant={getRoleBadgeVariant(roleName)} className="mb-2">
                      {roleName.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Badge>
                    <p className="text-3xl font-bold text-purple-600">{roleUsers.length}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {roleUsers.length === 1 ? 'User' : 'Users'}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={() => {
                        setActiveTab('components');
                        setSelectedRoleId(roleFromDB?.id || null);
                      }}
                    >
                      Manage Permissions
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Roles Details Table */}
          <Card variant="elevated">
            <CardHeader title="Role Details" subtitle="Overview of all roles and their users" />
            <div className="overflow-x-auto mt-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Users</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User Count</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueRoles.map((roleName) => {
                    const roleUsers = users.filter(u => u.role === roleName);
                    const roleFromDB = roles.find(r => r.name === roleName);
                    
                    return (
                      <tr key={roleName} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <Badge variant={getRoleBadgeVariant(roleName)}>
                            {roleName.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2">
                            {roleUsers.slice(0, 3).map((u) => (
                              <span key={u.id} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {u.name}
                              </span>
                            ))}
                            {roleUsers.length > 3 && (
                              <span className="text-sm text-gray-500 px-2 py-1">
                                +{roleUsers.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-gray-900">{roleUsers.length}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setActiveTab('components');
                                setSelectedRoleId(roleFromDB?.id || null);
                              }}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Permissions
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Component Permissions Tab */}
      {activeTab === 'components' && (
        <>
          {/* Role Selection */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Select Role</h3>
                  <p className="text-sm text-gray-600 mt-1">Choose a role to manage component permissions</p>
                </div>
                {hasUnsavedChanges && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleResetChanges}>
                      Reset Changes
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSavePermissions} isLoading={isLoadingPermissions}>
                      Save Changes ({permissionChanges.size})
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 flex-wrap">
                {roles.map((role) => {
                  const isSelected = selectedRoleId === role.id;
                  const userCount = users.filter(u => u.role === role.name).length;
                  return (
                    <Button
                      key={role.id}
                      variant={isSelected ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedRoleId(role.id)}
                    >
                      {role.name.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      {userCount > 0 && <span className="ml-1 opacity-70">({userCount})</span>}
                    </Button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Component Permissions Matrix */}
          {selectedRoleId && (
            <>
              {/* Category Filters */}
              <Card>
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Filter by category:</span>
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        variant={filterCategory === cat ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilterCategory(cat)}
                      >
                        {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Permissions Table */}
              <Card variant="elevated">
                <CardHeader 
                  title="Component Permissions" 
                  subtitle={`${filteredComponents.length} components ${filterCategory !== 'all' ? `in ${filterCategory}` : ''}`}
                />
                
                {isLoadingPermissions ? (
                  <div className="flex items-center justify-center p-12">
                    <Loading size="lg" />
                  </div>
                ) : (
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Component</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                            <div className="flex items-center justify-center gap-2">
                              <span>Can View</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleSelectAllView(true)}
                                  disabled={areAllViewEnabled}
                                  className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Select all"
                                >
                                  All
                                </button>
                                <button
                                  onClick={() => handleSelectAllView(false)}
                                  disabled={!filteredComponents.some(comp => getPermissionValue(comp.id, 'canView'))}
                                  className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Deselect all"
                                >
                                  None
                                </button>
                              </div>
                            </div>
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                            <div className="flex items-center justify-center gap-2">
                              <span>Can Interact</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleSelectAllInteract(true)}
                                  disabled={areAllInteractEnabled || filteredComponents.every(comp => !getPermissionValue(comp.id, 'canView'))}
                                  className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Select all (only for viewable components)"
                                >
                                  All
                                </button>
                                <button
                                  onClick={() => handleSelectAllInteract(false)}
                                  disabled={!filteredComponents.some(comp => getPermissionValue(comp.id, 'canInteract'))}
                                  className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Deselect all"
                                >
                                  None
                                </button>
                              </div>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredComponents.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-gray-500">
                              No components found
                            </td>
                          </tr>
                        ) : (
                          filteredComponents.map((component) => {
                            const canView = getPermissionValue(component.id, 'canView');
                            const canInteract = getPermissionValue(component.id, 'canInteract');
                            const hasChange = permissionChanges.has(component.id);
                            
                            return (
                              <tr 
                                key={component.id} 
                                className={cn(
                                  'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                                  hasChange && 'bg-purple-50'
                                )}
                              >
                                <td className="py-4 px-4">
                                  <div>
                                    <p className="font-medium text-gray-900">{component.display_name}</p>
                                    {component.description && (
                                      <p className="text-xs text-gray-500 mt-1">{component.description}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <Badge variant="default">
                                    {component.component_type}
                                  </Badge>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="text-sm text-gray-600">{component.category}</span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <Toggle
                                    checked={canView}
                                    onChange={(value) => handlePermissionToggle(component.id, 'canView', value)}
                                    size="sm"
                                  />
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <Toggle
                                    checked={canInteract}
                                    onChange={(value) => handlePermissionToggle(component.id, 'canInteract', value)}
                                    disabled={!canView}
                                    size="sm"
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}

          {/* Empty state when no role selected */}
          {!selectedRoleId && (
            <Card>
              <div className="p-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <p className="text-lg font-medium">Select a role to manage permissions</p>
                <p className="text-sm mt-1">Choose a role from the buttons above to view and edit component permissions</p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AccessManagementPage;

