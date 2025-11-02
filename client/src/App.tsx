import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { QueryProvider } from '@/providers/QueryProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import TaskManagerPage from '@/pages/TaskManagerPage';
import AccessManagementPage from '@/pages/AccessManagementPage';
import RiskManagementPage from '@/pages/RiskManagementPage';
import MyActionsPage from '@/pages/MyActionsPage';
import DepartmentActionsPage from '@/pages/DepartmentActionsPage';
import CLevelActionsPage from '@/pages/CLevelActionsPage';
import ManagementLevelActionsPage from '@/pages/ManagementLevelActionsPage';
import AllFindingsActionsPage from '@/pages/AllFindingsActionsPage';
import AuditMaturityPage from '@/pages/AuditMaturityPage';
import AuditPlanPage from '@/pages/AuditPlanPage';
import NotFoundPage from '@/pages/NotFoundPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import Loading from '@/components/ui/Loading';

const App: React.FC = () => {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <Loading fullScreen size="xl" text="Loading application..." />;
  }

  return (
    <ErrorBoundary>
      <QueryProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
          <Route index element={
            <ProtectedRoute requiredRoles={['admin', 'team', 'team_manager']}>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="tasks" element={
            <ProtectedRoute requiredRoles={['admin', 'team', 'team_manager']}>
              <TaskManagerPage />
            </ProtectedRoute>
          } />
          <Route path="my-actions" element={
            <ProtectedRoute requiredRoles={['admin', 'team', 'team_manager']}>
              <MyActionsPage />
            </ProtectedRoute>
          } />
          <Route path="department-actions" element={
            <ProtectedRoute requiredRoles={['admin', 'department_director']}>
              <DepartmentActionsPage />
            </ProtectedRoute>
          } />
          <Route path="clevel-actions" element={
            <ProtectedRoute requiredRoles={['admin', 'top_management']}>
              <CLevelActionsPage />
            </ProtectedRoute>
          } />
          <Route path="management-level-actions" element={
            <ProtectedRoute requiredRoles={['admin', 'management']}>
              <ManagementLevelActionsPage />
            </ProtectedRoute>
          } />
          <Route path="all-findings-actions" element={
            <ProtectedRoute requiredRoles={['admin', 'team', 'team_manager']}>
              <AllFindingsActionsPage />
            </ProtectedRoute>
          } />
          <Route path="audit-maturity" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AuditMaturityPage />
            </ProtectedRoute>
          } />
          <Route path="audit-plan" element={
            <ProtectedRoute requiredRoles={['admin', 'team', 'team_manager']}>
              <AuditPlanPage />
            </ProtectedRoute>
          } />
          <Route path="access-management" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AccessManagementPage />
            </ProtectedRoute>
          } />
          <Route path="risk-management" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <RiskManagementPage />
            </ProtectedRoute>
          } />
            </Route>

            {/* 404 - Catch all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;

