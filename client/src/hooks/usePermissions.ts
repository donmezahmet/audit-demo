import { useAuthStore } from '@/store/auth.store';

/**
 * Hook for checking component-based permissions
 * Uses the new dashboard_components permission system
 */
export function usePermissions() {
  const { permissions } = useAuthStore();

  /**
   * Check if user has permission to view a component
   * @param componentKey - The unique key from dashboard_components table
   * @returns boolean
   */
  const hasComponent = (componentKey: string): boolean => {
    if (!permissions?.components) return false;
    // In demo mode, admin has 'all' access
    if (permissions.components.includes('all')) return true;
    return permissions.components.includes(componentKey);
  };

  /**
   * Check if user can interact with a component (click buttons, export, etc.)
   * @param componentKey - The unique key from dashboard_components table
   * @returns boolean
   */
  const canInteract = (componentKey: string): boolean => {
    // In demo mode, if user has 'all' in components, they can interact with everything
    if (permissions?.components?.includes('all')) return true;
    if (!permissions?.interactiveComponents) return false;
    if (permissions.interactiveComponents.includes('all')) return true;
    return permissions.interactiveComponents.includes(componentKey);
  };

  /**
   * Check if user has any of the specified components
   * @param componentKeys - Array of component keys
   * @returns boolean
   */
  const hasAnyComponent = (componentKeys: string[]): boolean => {
    return componentKeys.some(key => hasComponent(key));
  };

  /**
   * Check if user has all of the specified components
   * @param componentKeys - Array of component keys
   * @returns boolean
   */
  const hasAllComponents = (componentKeys: string[]): boolean => {
    return componentKeys.every(key => hasComponent(key));
  };

  /**
   * Get all component keys user has access to
   * @returns string[]
   */
  const getAccessibleComponents = (): string[] => {
    return permissions?.components || [];
  };

  /**
   * Get all interactive component keys
   * @returns string[]
   */
  const getInteractiveComponents = (): string[] => {
    return permissions?.interactiveComponents || [];
  };

  return {
    hasComponent,
    canInteract,
    hasAnyComponent,
    hasAllComponents,
    getAccessibleComponents,
    getInteractiveComponents,
  };
}

