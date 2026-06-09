import { create } from 'zustand';

export type ModuleKey = 'accueil' | 'governance' | 'finance' | 'operational' | 'rh' | 'risque' | 'pta';
export type AdminViewKey = 'admin_dashboard' | 'admin_users' | 'admin_roles' | 'admin_datasources' | 'admin_logs';

export type AppViewKey = ModuleKey | 'admin';

export interface FilterState {
  year: number;
  quarter: number | null;
  month: number | null;
  departmentId: string | null;
}

interface AppState {
  activeModule: ModuleKey;
  setActiveModule: (module: ModuleKey) => void;
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  lastUpdated: string;
  setLastUpdated: (value: string) => void;
  // Admin
  activeView: AppViewKey;
  setActiveView: (view: AppViewKey) => void;
  adminSubView: AdminViewKey;
  setAdminSubView: (view: AdminViewKey) => void;
}

const initialState: FilterState = {
  year: 2025,
  quarter: 2,
  month: null,
  departmentId: null,
};

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'accueil',
  setActiveModule: (module) => set({ activeView: module, activeModule: module }),
  filters: initialState,
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  lastUpdated: '',
  setLastUpdated: (value) => set({ lastUpdated: value }),
  // Admin
  activeView: 'accueil',
  setActiveView: (view) => set((state) => {
    const updates: Record<string, any> = { activeView: view };
    if (view !== 'admin') {
      updates.activeModule = view as ModuleKey;
    }
    if (view === 'admin') {
      updates.adminSubView = 'admin_dashboard';
    }
    return updates;
  }),
  adminSubView: 'admin_dashboard',
  setAdminSubView: (view) => set({ adminSubView: view }),
}));
