# Module Gouvernance

**Menu sidebar** : Gouvernance  
**Icône** : `Landmark`  
**Clé** : `governance`

## Rôle

Indicateurs de pilotage et de gouvernance de l'organisation : suivi des instances, conformité, qualité, audit interne.

## Composants utilisés

| Composant | Rôle |
|-----------|------|
| `ModuleHeroSection` | En-tête du module avec stats clés |
| `KpiModuleView` | Grille complète des indicateurs |
| `ModuleDocuments` | Documents liés au module |

## Sous-domaines typiques

- Pilotage stratégique
- Conformité
- Qualité
- Audit
- Instance

## Contenu de la vue

1. **Hero section** : nom du module, description, nombre d'indicateurs, synthèse des statuts (atteint/partiel/non_atteint/sans_valeur)
2. **Cartes prioritaires** : 2-3 KPIs clés en surbrillance
3. **Grille détaillée** : tous les indicateurs groupés par sous-domaine, chaque ligne avec nom, valeur, cible, écart, tendance, statut

## API

- `GET /api/indicators/domain?domain=GOUVERNANCE&year=...&quarter=...` — indicateurs du module

## Documents associés

Liens vers documents externes (SharePoint, OneDrive, Google Drive) filtrés par catégorie.

## Fichiers

```
src/components/cockpit/ModuleHeroSection.tsx
src/components/cockpit/KpiModuleView.tsx
src/components/cockpit/ModuleDocuments.tsx
```
