import { create } from 'zustand';

export type ModuleKey = 'accueil' | 'governance' | 'finance' | 'operational' | 'rh' | 'risque' | 'pta';

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
}

const initialState: FilterState = {
  year: 2025,
  quarter: 2,
  month: null,
  departmentId: null,
};

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'accueil',
  setActiveModule: (module) => set({ activeModule: module }),
  filters: initialState,
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  lastUpdated: new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }),
}));
