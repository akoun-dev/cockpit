import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setUserId } from '@/lib/user-id';

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
  // Search highlight
  highlightIndicatorId: string | null;
  setHighlightIndicatorId: (id: string | null) => void;
  highlightSubDomain: string | null;
  setHighlightSubDomain: (sub: string | null) => void;
  // Server-side preferences sync
  preferencesLoaded: boolean;
  loadPreferences: () => Promise<void>;
  saveCardOrder: (cardOrder: Record<string, string[]>) => Promise<void>;
}

const initialState: FilterState = {
  year: new Date().getFullYear(),
  quarter: 2,
  month: null,
  periodStart: null,
  periodEnd: null,
  departmentId: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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
        set((state) => {
          const newCardOrder = { ...state.cardOrder, [key]: order };
          get().saveCardOrder(newCardOrder);
          return { cardOrder: newCardOrder };
        }),
      resetCardOrder: (key) =>
        set((state) => {
          const newOrder = { ...state.cardOrder };
          delete newOrder[key];
          get().saveCardOrder(newOrder);
          return { cardOrder: newOrder };
        }),
      // Search highlight
      highlightIndicatorId: null,
      setHighlightIndicatorId: (id) => set({ highlightIndicatorId: id }),
      highlightSubDomain: null,
      setHighlightSubDomain: (sub) => set({ highlightSubDomain: sub }),
      // Server-side preferences sync
      preferencesLoaded: false,
      loadPreferences: async () => {
        try {
          const res = await fetch('/api/user/preferences');
          if (res.ok) {
            const data = await res.json() as Record<string, unknown>;
            if (data.cardOrder && typeof data.cardOrder === 'object') {
              set({ cardOrder: data.cardOrder as Record<string, string[]> });
            }
            // Set the user ID from session
            if (typeof data._userId === 'string') {
              setUserId(data._userId);
            }
          }
        } catch { /* use local state */ }
        set({ preferencesLoaded: true });
      },
      saveCardOrder: async (cardOrder: Record<string, string[]>) => {
        try {
          await fetch('/api/user/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardOrder }),
          });
        } catch { /* silent */ }
      },
    }),
    {
      name: 'ansut-cockpit-dnd',
      partialize: (state) => ({ cardOrder: state.cardOrder }),
    }
  )
);
