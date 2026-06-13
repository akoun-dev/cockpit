# Audit des Modules Cockpit DG

## Résumé Exécutif

| Priorité | Problèmes trouvés |
|----------|------------------|
| **CRITIQUE** | 5 — routes admin sans vérification d'autorisation |
| **HAUTE** | 8 — mots de passe en clair, absence de rate limiting, logs PII |
| **MOYENNE** | 15 — duplication de code, accessibilité, responsive, années codées en dur |
| **FAIBLE** | 20+ — composants monolithiques, magic numbers, types contournés |

---

## 1. Sécurité — CRITIQUE

### Routes admin sans autorisation
Plusieurs routes API n'ont AUCUNE vérification que l'utilisateur est administrateur :

| Fichier | Problème |
|---------|----------|
| `src/app/api/admin/users/route.ts:10` | GET et POST vérifient seulement que `session?.user?.id` existe, pas le rôle admin |
| `src/app/api/admin/roles/route.ts:15` | GET et POST sans vérification admin |
| `src/app/api/admin/roles/[id]/route.ts:20` | GET/PUT/DELETE sans vérification admin |
| `src/app/api/admin/settings/route.ts:10` | GET **totalement public** (pas d'auth du tout) |
| `src/app/api/admin/audit-logs/route.ts:10` | GET **totalement public** — expose tout l'audit |

**Impact** : Tout utilisateur authentifié peut lister/créer/modifier/supprimer des utilisateurs, rôles, paramètres et voir le journal d'audit.

**Fix** : Ajouter `requireAdmin()` sur toutes ces routes.

### Mots de passe en clair
| Fichier | Problème |
|---------|----------|
| `prisma/schema.prisma:159` | `DataSource.password` stocké en clair dans la base |
| `prisma/schema.prisma:238` | `NotificationConfig.smtpPassword` stocké en clair dans la base |
| `prisma/seed.ts:387-398` | Mot de passe par défaut `ansut2025` affiché dans la console |
| `src/app/api/admin/users/route.ts:69` | Mot de passe par défaut `ansut2025` codé en dur |

### Absence de rate limiting
| Fichier | Problème |
|---------|----------|
| `src/app/api/auth/forgot-password/route.ts` | Aucune limitation — attaque par énumération de compte possible |
| `src/app/api/auth/reset-password/route.ts` | Aucune limitation — force brute sur le token possible |
| `src/app/api/user/password/route.ts` | Aucune limitation — force brute sur l'ancien mot de passe |
| `src/lib/auth.ts` | Aucune limitation sur les tentatives de connexion |

---

## 2. Architecture — HAUTE

### Duplication massive

#### 6 modules métier identiques
`GovernanceModule.tsx`, `FinanceModule.tsx`, `OperationalModule.tsx`, `RHModule.tsx`, `RisqueModule.tsx`, `PTAModule.tsx` — 18 lignes chacun, **100% identiques** hormis le domaine :

```tsx
'use client';
import { ModuleHeroSection, KpiModuleView, ModuleDocuments } from '@/components/cockpit';
import { useAppStore } from '@/lib/store';
export function XXModule() {
  const { filters } = useAppStore();
  const key = `module-${filters.year}-${filters.quarter}-${filters.month}-${filters.period?.[0]}-${filters.period?.[1]}`;
  return (
    <div key={key} className="space-y-6">
      <ModuleHeroSection domain="XX" />
      <KpiModuleView domain="XX" />
      <ModuleDocuments domain="XX" />
    </div>
  );
}
```

**Fix** : Remplacer par un seul composant `DomainModule` paramétré par `domain`.

#### Duplication de types et helpers
| Élément | DashboardAccueil | ModuleHeroSection | KpiModuleView | Storytelling |
|---------|:-:|:-:|:-:|:-:|
| `Indicator` | — | ✅ | ✅ | ✅ |
| `computeStatus` | ✅ | ✅ | ✅ | ✅ |
| `formatValue` | — | ✅ | ✅ | — |
| `isLowerBetter` | — | ✅ | ✅ | — |
| `SUB_DOMAIN_LABELS` | — | ✅ | ✅ | ✅ |
| `statusChartConfig` | ✅ | ✅ | — | — |

**Fix** : Extraire dans `src/lib/indicators.ts` et `src/lib/constants.ts`.

### `auth.ts` dupliqué (384 lignes)
`buildAuthOptions()` et `authOptions` sont deux implémentations quasi-identiques (~140 lignes dupliquées). La version statique ne devrait pas exister.

### Composants monolithiques
| Fichier | Lignes | Devrait être découpé en |
|---------|--------|------------------------|
| `Header.tsx` | 1291 | ExportButton, FilterBar, SearchDialog, UserMenu, StorytellingButton |
| `DashboardAccueil.tsx` | 947 | ExecutiveStrip, DomainCards, AlertsSection, ChartsSection |
| `StorytellingOverlay.tsx` | 567 | TitleSlide, SynthesisSlide, SubdomainSlide, ClosingSlide |

---

## 3. API et Backend — HAUTE

### Incohérences
| Fichier | Problème |
|---------|----------|
| `src/app/api/dashboard/route.ts:124` | Liste des domaines dupliquée vs `permissions.ts` |
| `src/app/api/indicators/domain/route.ts` | Domaine par défaut `'finance'` si paramètre absent |
| `src/app/api/export/pptx/route.ts` | Logique `getStatus` incohérente avec `dashboard/route.ts` |
| `src/app/api/user/preferences/route.ts` | N'utilise pas `requireAuth` contrairement aux autres routes |

### Année 2025 codée en dur
| Fichier | Ligne |
|---------|-------|
| `src/app/api/indicators/domain/route.ts` | 20 |
| `src/app/api/dashboard/route.ts` | 56 |
| `src/app/lib/store.ts` | 20 |
| `src/components/cockpit/DashboardAccueil.tsx` | 899 |
| `src/components/cockpit/Header.tsx` | 238 |

### Cache JWT jamais invalidé
`src/app/api/auth/[...nextauth]/route.ts` — `cached` reste en mémoire jusqu'au redémarrage du processus.

---

## 4. Responsive et Mobile — MOYENNE

| Composant | Problème |
|-----------|----------|
| `DashboardAccueil.tsx` | `hidden sm:flex` masque valeurs/target sur mobile ; donut chart `w-[160px]` fixe |
| `ModuleHeroSection.tsx` | Drag overlay `w-[250px]` fixe peut déborder |
| `KpiModuleView.tsx` | `max-h-[600px]` sur le tableau trop grand pour mobile |
| `StorytellingOverlay.tsx` | `min-w-[450px]` sur les tableaux force scroll horizontal |
| `Header.tsx` | 3 implémentations de filtres (desktop/mobile/tablette) — complexité excessive |
| `AdminRoles.tsx` | `w-[200px]` sur les selects de permission (corrigé en `w-full sm:w-[200px]`) |
| `AdminLayout.tsx` | Nav barre admin scrollait avec le contenu (corrigé) |

---

## 5. Accessibilité — MOYENNE

| Problème | Occurrences |
|----------|-------------|
| Icônes de tendance sans `aria-label` | KpiCard, ModuleHeroSection, DashboardAccueil |
| Graphiques Recharts sans équivalent texte | DashboardAccueil, ModuleHeroSection |
| Couleur seule pour les statuts (pas de label texte) | KpiCard, StatusBadge, DashboardAccueil |
| `StorytellingOverlay` sans `role="dialog"` ni focus trap | 1 |
| Pas de `aria-live` pour les mises à jour asynchrones | DashboardAccueil, Storytelling |
| Pas de `required` sur les champs de formulaire | ProfileDialog |

---

## 6. Gestion d'Erreurs — MOYENNE

| Fichier | Problème |
|---------|----------|
| `DashboardAccueil.tsx` | `try/catch` silencieux → page blanche si API échoue |
| `ModuleHeroSection.tsx` | `catch` silencieux → retourne `null` sans message |
| `StorytellingOverlay.tsx` | `.catch(() => {})` → spinner tourne indéfiniment |
| `ModuleDocuments.tsx` | Erreur → liste vide, pas de feedback |
| `store.ts` | `loadPreferences` erreur silencieuse, pas de notification |
| `user-id.ts` | `catch {}` silencieux sur le parse JSON |

---

## 7. TypeScript — FAIBLE

| Fichier | Problème |
|---------|----------|
| `auth.ts` | Casts `as unknown as` contournant les types augmentés (lignes 154, 171-173) |
| `DashboardAccueil.tsx` | `as unknown as Record<string, unknown>[]` pour les données Recharts |
| `StorytellingOverlay.tsx` | `as KpiData[]`, `as Slide \| undefined` — bypass du vérificateur |
| `ProfileDialog.tsx` | `as Record<string, unknown>` pour les props session utilisateur |
| `require-auth.ts` | Type de retour ambigu — `NextResponse` ou `Session` |
| `store.ts` | `ModuleKey` et `AdminViewKey` devraient être des unions string |

---

## 8. Base de Données — MOYENNE

| Problème | Fichier |
|----------|---------|
| `User.password` default `"ansut2025"` | `schema.prisma:16` |
| `DataSource.password` en clair | `schema.prisma:159` |
| Pas d'index sur `AuditLog.createdAt` | `schema.prisma` |
| `IndicatorValue.period` en texte libre (pas de type structuré) | `schema.prisma:131` |
| SQLite — pas d'opérations concurrentes sécurisées | `schema.prisma` |
| `NotificationConfig.smtpPassword` en clair | `schema.prisma:238` |

---

## 9. Recommandations Prioritaires

### Immédiat (CRITIQUE)
1. ✅ `requireAdmin()` sur toutes les routes `/api/admin/*`
2. ✅ Masquer les logs d'identifiants dans `auth.ts` et `seed.ts`
3. ✅ Ajouter `requireAuth()` sur `GET /api/admin/settings` et `GET /api/admin/audit-logs`

### Court terme (HAUTE)
4. Fusionner les 6 modules métier en un seul composant paramétré
5. Extraire `Indicator`, `computeStatus`, `SUB_DOMAIN_LABELS` dans des fichiers partagés
6. Chiffrer `DataSource.password` et `NotificationConfig.smtpPassword`
7. Remplacer les années codées en dur par `new Date().getFullYear()`
8. Découper `Header.tsx` (1291 lignes)

### Moyen terme (MOYENNE)
9. Ajouter `aria-label` sur toutes les icônes de tendance et statut
10. Ajouter `role="dialog"` et focus trap sur `StorytellingOverlay`
11. Ajouter une gestion d'erreur visible (toast) pour tous les échecs API
12. Ajouter du rate limiting sur les routes d'authentification
13. Supprimer la version statique dupliquée dans `auth.ts`

---

*Audit réalisé le 13/06/2026 — 35 fichiers analysés, ~12 000 lignes de code.*
