// ─── Shared constants for admin and cockpit modules ──────────────────────

export const MODULE_LABELS: Record<string, string> = {
  accueil: 'Accueil',
  governance: 'Gouvernance',
  finance: 'Finance',
  operational: 'Opérationnel',
  rh: 'Ressources Humaines',
  risque: 'Cadre de Risque',
  pta: 'Plan de Travail Annuel',
  admin: 'Administration',
};

export const MODULE_KEYS = Object.keys(MODULE_LABELS);

export const MODULE_COLORS: Record<string, string> = {
  accueil: 'bg-emerald-500',
  governance: 'bg-fun-blue',
  finance: 'bg-green-600',
  operational: 'bg-tango',
  rh: 'bg-amber-500',
  risque: 'bg-red-500',
  pta: 'bg-violet-600',
  admin: 'bg-gray-600',
};

export const CATEGORY_COLORS: Record<string, string> = {
  auth: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  user: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  role: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  permission: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  data: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  export: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  sync: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  alerte: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  security: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  kpi: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  document: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  notification: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  setting: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
};

export const SUB_DOMAIN_LABELS: Record<string, string> = {
  reporting_reglementaire: 'Reporting réglementaire',
  gouvernance_ethique: 'Gouvernance & Éthique',
  marches_publics: 'Passation des Marchés Publics',
  relations_publiques: 'Dons, Honoraires & Relations Publiques',
  execution_budgetaire: 'Exécution budgétaire',
  rentabilite: 'Rentabilité & Performance',
  ressources_specifiques: 'Ressources Spécifiques',
  dette: 'Endettement',
  deploiement_infra: 'Déploiement Infrastructures',
  relations_operateurs: 'Relations Opérateurs',
  service_universel: 'Service Universel',
  projets_programmes: 'Projets & Programmes',
  effectifs: 'Effectifs & Organisation',
  performance: 'Performance & Productivité',
  competences: 'Développement Compétences',
  couts_rh: 'Maîtrise Coûts RH',
  risque_strategique: 'Risque Stratégique',
  risque_financier: 'Risque Financier',
  risque_operationnel: 'Risque Opérationnel',
  risque_technologique: 'Risque Technologique',
  risque_gouvernance: 'Risque Gouvernance',
  pta_gouvernance: 'Gouvernance',
  pta_operationnel: 'Opérationnel',
  pta_finance: 'Finance',
};

export const CATEGORY_LABELS: Record<string, string> = {
  auth: 'Authentification',
  user: 'Utilisateur',
  role: 'Rôle',
  permission: 'Permission',
  data: 'Données',
  export: 'Export',
  sync: 'Synchronisation',
  alerte: 'Alerte',
  security: 'Sécurité',
  kpi: 'KPI',
  document: 'Document',
  notification: 'Notification',
  setting: 'Paramètre',
};
