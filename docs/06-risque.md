# Module Cadre de Risque

**Menu sidebar** : Cadre de Risque  
**Icône** : `ShieldAlert`  
**Clé** : `risque`

## Rôle

Indicateurs de gestion des risques : identification, évaluation, mitigation, suivi des risques majeurs.

## Composants utilisés

| Composant | Rôle |
|-----------|------|
| `ModuleHeroSection` | En-tête du module avec stats clés |
| `KpiModuleView` | Grille complète des indicateurs |
| `ModuleDocuments` | Documents liés au module |

## Sous-domaines typiques

- Risques stratégiques
- Risques opérationnels
- Risques financiers
- Risques de conformité
- Plans de mitigation

## Contenu de la vue

1. **Hero section** : synthèse des indicateurs de risque, cartographie
2. **Cartes prioritaires** : KPIs risques clés
3. **Grille détaillée** : tous les indicateurs groupés par sous-domaine, chaque ligne avec nom, valeur, cible, écart, tendance, statut

## API

- `GET /api/indicators/domain?domain=RISQUE&year=...&quarter=...` — indicateurs du module

## Fichiers

```
src/components/cockpit/ModuleHeroSection.tsx
src/components/cockpit/KpiModuleView.tsx
src/components/cockpit/ModuleDocuments.tsx
```
