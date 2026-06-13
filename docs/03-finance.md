# Module Finance

**Menu sidebar** : Finance  
**Icône** : `Wallet`  
**Clé** : `finance`

## Rôle

Indicateurs de gestion financière et budgétaire : exécution budgétaire, trésorerie, engagements, dépenses.

## Composants utilisés

| Composant | Rôle |
|-----------|------|
| `ModuleHeroSection` | En-tête du module avec stats clés |
| `KpiModuleView` | Grille complète des indicateurs |
| `ModuleDocuments` | Documents liés au module |

## Sous-domaines typiques

- Budget
- Trésorerie
- Dépenses
- Recettes
- Engagements

## Contenu de la vue

1. **Hero section** : synthèse des indicateurs financiers, taux d'exécution, alertes
2. **Cartes prioritaires** : KPIs financiers clés
3. **Grille détaillée** : tous les indicateurs groupés par sous-domaine, chaque ligne avec nom, valeur, cible, écart, tendance, statut

## API

- `GET /api/indicators/domain?domain=FINANCE&year=...&quarter=...` — indicateurs du module

## Fichiers

```
src/components/cockpit/ModuleHeroSection.tsx
src/components/cockpit/KpiModuleView.tsx
src/components/cockpit/ModuleDocuments.tsx
```
