'use client';

import React, { useEffect, useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import { useAppStore, type ModuleKey, type AppViewKey } from '@/lib/store';

const MODULE_LABELS: Record<AppViewKey, string> = {
  accueil: 'Tableau de Bord',
  governance: 'Gouvernance',
  finance: 'Finance',
  operational: 'Opérationnel',
  rh: 'Ressources Humaines',
  risque: 'Cadre de Risque',
  pta: "Plan Triennal d'Actions",
  admin: 'Administration',
};

const YEARS = [2024, 2025];
const QUARTERS = [
  { value: '1', label: 'T1 - Premier trimestre' },
  { value: '2', label: 'T2 - Deuxième trimestre' },
  { value: '3', label: 'T3 - Troisième trimestre' },
  { value: '4', label: 'T4 - Quatrième trimestre' },
];

interface Department {
  id: string;
  name: string;
}

export function Header() {
  const { activeView, filters, setFilters } = useAppStore();
  const isAdmin = activeView === 'admin';
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await fetch('/api/departments');
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } catch {
        // Fallback departments if API not available
        setDepartments([
          { id: 'all', name: 'Tous les départements' },
          { id: 'direction', name: 'Direction Générale' },
          { id: 'finance', name: 'Finance & Comptabilité' },
          { id: 'rh', name: 'Ressources Humaines' },
          { id: 'ops', name: 'Opérations' },
          { id: 'it', name: 'Technologie' },
          { id: 'juridique', name: 'Juridique' },
          { id: 'communication', name: 'Communication' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchDepartments();
  }, []);

  const handleExportExcel = () => {
    // Placeholder: will be connected to export functionality
    const data = { module: activeView, filters };
    console.log('Export Excel:', data);
  };

  const handleExportPdf = () => {
    // Placeholder: will be connected to export functionality
    const data = { module: activeView, filters };
    console.log('Export PDF:', data);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-fun-blue px-4 py-3 text-white shadow-md lg:px-6">
      {/* Left: sidebar trigger + title */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-white hover:bg-white/10 hover:text-white" />
        <div className="flex flex-col">
          <h1 className="text-lg font-bold leading-tight lg:text-xl">
            {MODULE_LABELS[activeView]}
          </h1>
          <p className="hidden text-xs text-white/70 sm:block">
            {isAdmin ? 'Panneau d\'administration système' : 'Cockpit de Direction Générale'}
          </p>
        </div>
      </div>

      {/* Right: filters + export */}
      <div className="flex items-center gap-2 lg:gap-3">
        {!isAdmin && (<>
        <Select
          value={String(filters.year)}
          onValueChange={(val) => setFilters({ year: Number(val) })}
        >
          <SelectTrigger
            size="sm"
            className="h-8 w-[80px] border-white/20 bg-white/10 text-white text-xs backdrop-blur-sm hover:bg-white/20"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Quarter selector */}
        <Select
          value={filters.quarter ? String(filters.quarter) : 'all'}
          onValueChange={(val) =>
            setFilters({ quarter: val === 'all' ? null : Number(val) })
          }
        >
          <SelectTrigger
            size="sm"
            className="h-8 w-[100px] border-white/20 bg-white/10 text-white text-xs backdrop-blur-sm hover:bg-white/20"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {QUARTERS.map((q) => (
              <SelectItem key={q.value} value={q.value}>
                {q.label.split(' - ')[0]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Department selector */}
        <Select
          value={filters.departmentId || 'all'}
          onValueChange={(val) =>
            setFilters({ departmentId: val === 'all' ? null : val })
          }
        >
          <SelectTrigger
            size="sm"
            className="hidden h-8 w-[180px] border-white/20 bg-white/10 text-white text-xs backdrop-blur-sm hover:bg-white/20 md:flex"
          >
            <SelectValue placeholder="Département" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les départements</SelectItem>
            {departments
              .filter((d) => d.id !== 'all')
              .map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 border border-white/20 bg-white/10 text-white text-xs backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Exporter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleExportExcel} className="gap-2 cursor-pointer">
              <FileSpreadsheet className="size-4 text-green-600" />
              Exporter Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPdf} className="gap-2 cursor-pointer">
              <FileText className="size-4 text-red-600" />
              Exporter PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </>)}
      </div>
    </header>
  );
}
