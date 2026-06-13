# Module PTA

**Menu sidebar** : PTA  
**Icône** : `Target`  
**Clé** : `pta`

## Rôle

Indicateurs du Plan de Travail Annuel : suivi des actions, jalons, taux de réalisation, échéances.

## Composants utilisés

| Composant | Rôle |
|-----------|------|
| `ModuleHeroSection` | En-tête du module avec stats clés |
| `KpiModuleView` | Grille complète des indicateurs |
| `ModuleDocuments` | Documents liés au module |

## Sous-domaines typiques

- Actions
- Jalons
- Réalisations
- Échéances
- Budget PTA

## Contenu de la vue

1. **Hero section** : synthèse du PTA, taux de réalisation global
2. **Cartes prioritaires** : KPIs PTA clés
3. **Grille détaillée** : tous les indicateurs groupés par sous-domaine, chaque ligne avec nom, valeur, cible, écart, tendance, statut

## API

- `GET /api/indicators/domain?domain=PTA&year=...&quarter=...` — indicateurs du module

## Fichiers

```
src/components/cockpit/ModuleHeroSection.tsx
src/components/cockpit/KpiModuleView.tsx
src/components/cockpit/ModuleDocuments.tsx
```
