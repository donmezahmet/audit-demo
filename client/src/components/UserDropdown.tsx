import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks';
import { cn } from '@/utils/cn';

interface UserDropdownProps {
  onOpenEmailModal: () => void;
  onLogout: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ onOpenEmailModal, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, role } = useAuthStore();
  const { hasComponent } = usePermissions();

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

  const canSendEmail = hasComponent('send_email_button');

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      // Dropdown opened
    }
  }, [isOpen, canSendEmail, role]);

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:bg-white/10 rounded-lg p-2 transition-colors"
      >
        <div className="hidden md:flex flex-col items-end">
          <span className="text-white text-sm font-medium">
            {user?.name}
          </span>
          <span className="text-purple-200 text-xs">
            {user?.email}
          </span>
        </div>
        
        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>

        <svg
          className={cn(
            'w-4 h-4 text-white transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* User Info Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-semibold">{user?.name}</p>
                <p className="text-xs text-purple-200">{user?.email}</p>
                <p className="text-xs text-purple-300 mt-1">
                  {role?.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {canSendEmail && (
              <button
                onClick={() => handleMenuItemClick(onOpenEmailModal)}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 transition-colors"
              >
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Send Email</span>
              </button>
            )}

            <button
              onClick={() => handleMenuItemClick(onLogout)}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 transition-colors border-t border-gray-100"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;

