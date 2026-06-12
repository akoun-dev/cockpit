import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModuleKey = 'accueil' | 'governance' | 'finance' | 'operational' | 'rh' | 'risque' | 'pta';

export type AdminViewKey =
  | 'admin_dashboard'
  | 'admin_users'
  | 'admin_roles'
  | 'admin_indicators'
  | 'admin_datasources'
  | 'admin_sync'
  | 'admin_documents'
  | 'admin_alerts'
  | 'admin_logs'
  | 'admin_notifications'
  | 'admin_settings'
  | 'admin_security';

export type AppViewKey = ModuleKey | 'admin';

export interface FilterState {
  year: number;
  quarter: number | null;
  month: number | null;
  periodStart: string | null;
  periodEnd: string | null;
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
  // Drag & Drop — custom card order per domain/sub-domain
  cardOrder: Record<string, string[]>;
  setCardOrder: (key: string, order: string[]) => void;
  resetCardOrder: (key: string) => void;
  // Search highlight — indicator ID + sub-domain to visually highlight for 2 seconds
  highlightIndicatorId: string | null;
  setHighlightIndicatorId: (id: string | null) => void;
  highlightSubDomain: string | null;
  setHighlightSubDomain: (sub: string | null) => void;
}

const initialState: FilterState = {
  year: 2025,
  quarter: 2,
  month: null,
  periodStart: null,
  periodEnd: null,
  departmentId: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeModule: 'accueil',
      setActiveModule: (module) => set({ activeView: module, activeModule: module, highlightSubDomain: null, highlightIndicatorId: null }),
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
        const updates: Record<string, unknown> = { activeView: view };
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
      // Drag & Drop card order
      cardOrder: {},
      setCardOrder: (key, order) =>
        set((state) => ({
          cardOrder: { ...state.cardOrder, [key]: order },
        })),
      resetCardOrder: (key) =>
        set((state) => {
          const newOrder = { ...state.cardOrder };
          delete newOrder[key];
          return { cardOrder: newOrder };
        }),
      // Search highlight
      highlightIndicatorId: null,
      setHighlightIndicatorId: (id) => set({ highlightIndicatorId: id }),
      highlightSubDomain: null,
      setHighlightSubDomain: (sub) => set({ highlightSubDomain: sub }),
    }),
    {
      name: 'ansut-cockpit-dnd',
      partialize: (state) => ({ cardOrder: state.cardOrder }),
    }
  )
);