import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Loading } from '@/components/ui';
import { userService } from '@/services/user.service';
import { useDebounce } from '@/hooks';

interface ViewAsDropdownProps {
  onSelectUser: (email: string) => void;
  className?: string;
  filterByRole?: string | string[] | null; // Optional: filter users by specific role(s)
}

const ViewAsDropdown: React.FC<ViewAsDropdownProps> = ({ onSelectUser, className = '', filterByRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const response = await userService.getAccessManagementUsers();
        if (response.success && response.data) {
          // Filter by role if specified
          const allUsers = response.data;
          let roleFilteredUsers = allUsers;
          
          if (filterByRole) {
            if (Array.isArray(filterByRole)) {
              // Multiple roles
              roleFilteredUsers = allUsers.filter(u => filterByRole.includes(u.role));
            } else {
              // Single role
              roleFilteredUsers = allUsers.filter(u => u.role === filterByRole);
            }
          }
          
          setUsers(roleFilteredUsers);
          setFilteredUsers(roleFilteredUsers);
        }
      } catch (error) {
        // Failed to load users
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, filterByRole]);

  // Filter users based on search term
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter((user) =>
      user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [debouncedSearchTerm, users]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectUser = (email: string) => {
    onSelectUser(email);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        View As
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              autoFocus
            />
          </div>

          {/* User List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loading size="md" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="mt-2">No users found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <button
                    key={user.email}
                    onClick={() => handleSelectUser(user.email)}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        {user.role && (
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                            {user.role.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAsDropdown;

