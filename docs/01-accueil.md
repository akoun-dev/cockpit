# Module Accueil

**Menu sidebar** : Accueil  
**Icône** : `LayoutDashboard`  
**Composant** : `DashboardAccueil.tsx`  
**Clé** : `accueil`

## Rôle

Vue d'accueil du cockpit : synthèse globale des KPIs prioritaires (Lot 1) tous modules confondus avec graphiques et résumé par statut.

## Composants utilisés

| Composant | Rôle |
|-----------|------|
| `DashboardAccueil` | Page d'accueil complète |
| `KpiCard` | Carte individuelle d'indicateur |
| `StatusBadge` | Badge de statut coloré |
| `Header` | Barre de navigation et filtres |
| `AppSidebar` | Menu latéral |

## Fonctionnalités

- **KPIs prioritaires** : affiche les indicateurs du Lot 1 triés par module
- **Graphiques** : radar (statuts par sous-domaine), barres (évolution)
- **Drag & drop** : réorganisation des cartes KPI persistée par utilisateur
- **Boutons d'action** : chaque carte propose export, favori, etc.
- **Navigation** : clic sur une carte ouvre la vue modale `KpiModuleView`

## API

- `GET /api/dashboard` — données du dashboard global
- `GET /api/indicators?lot=1` — indicateurs prioritaires
- `GET /api/user/preferences` — disposition personnalisée des cartes

## Fichiers

```
src/components/cockpit/DashboardAccueil.tsx
src/components/cockpit/KpiCard.tsx
src/components/cockpit/StatusBadge.tsx
src/components/cockpit/Header.tsx
src/components/cockpit/AppSidebar.tsx
```
