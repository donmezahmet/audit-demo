import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Button } from '@/components/ui';
import { cn } from '@/utils/cn';
import UserDropdown from '../UserDropdown';

interface HeaderProps {
  onOpenEmailModal?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenEmailModal }) => {
  const navigate = useNavigate();
  const { user, role, isImpersonating, originalUser, logout, stopImpersonation } = useAuthStore();
  const [isStoppingImpersonation, setIsStoppingImpersonation] = useState(false);

  const handleStopViewAs = async () => {
    try {
      setIsStoppingImpersonation(true);
      await stopImpersonation();
    } catch (error) {
      // Failed to stop impersonation
    } finally {
      setIsStoppingImpersonation(false);
    }
  };

  const handleLogoClick = () => {
    // Check if user has access to dashboard
    const dashboardRoles = ['admin', 'team'];
    if (role && dashboardRoles.includes(role)) {
      navigate('/');
    }
  };
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500 text-black px-6 py-2 flex items-center justify-between text-sm font-medium shadow-lg">
          <span>
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Viewing as: <strong>{user?.email}</strong> (Original: {originalUser?.email})
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStopViewAs}
            isLoading={isStoppingImpersonation}
            className="bg-black text-yellow-500 hover:bg-gray-800 border-black"
          >
            Stop Viewing
          </Button>
        </div>
      )}

      <header
        className={cn(
          'fixed left-0 right-0 z-50 h-16',
          isImpersonating ? 'top-10' : 'top-0',
          'bg-gradient-to-r from-teal-600 to-cyan-600',
          'shadow-lg border-b border-teal-700/20',
          'backdrop-blur-lg',
          'transition-all duration-200'
        )}
      >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isSidebarOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
          
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleLogoClick}
          >
            <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
              </svg>
            </div>
            <h1 className="text-white text-lg font-semibold hidden md:block">
              Demo Company Audit Dashboard
            </h1>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {user && (
            <>
              {/* User Dropdown Menu */}
              <UserDropdown 
                onOpenEmailModal={() => onOpenEmailModal?.()} 
                onLogout={handleLogout} 
              />
            </>
          )}
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;

