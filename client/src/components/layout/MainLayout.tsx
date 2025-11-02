import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import EmailModal from '../EmailModal';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/utils/cn';

const MainLayout: React.FC = () => {
  const { isSidebarOpen } = useUIStore();
  const { isImpersonating } = useAuthStore();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onOpenEmailModal={() => setIsEmailModalOpen(true)} />
      <Sidebar />
      <EmailModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
      
      <main
        className={cn(
          'transition-all duration-300',
          'min-h-screen',
          // Account for header height + impersonation banner if active
          isImpersonating ? 'pt-[104px]' : 'pt-16',
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        )}
      >
        <div className="p-6 max-w-[1920px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

