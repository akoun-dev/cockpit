# Module Opérationnel

**Menu sidebar** : Opérationnel  
**Icône** : `Settings`  
**Clé** : `operational`

## Rôle

Indicateurs opérationnels : suivi des projets, activités, services, infrastructures et processus métier.

## Composants utilisés

| Composant | Rôle |
|-----------|------|
| `ModuleHeroSection` | En-tête du module avec stats clés |
| `KpiModuleView` | Grille complète des indicateurs |
| `ModuleDocuments` | Documents liés au module |

## Sous-domaines typiques

- Projets
- Activités
- Services
- Infrastructure
- Processus

## Contenu de la vue

1. **Hero section** : synthèse des indicateurs opérationnels
2. **Cartes prioritaires** : KPIs opérationnels clés
3. **Grille détaillée** : tous les indicateurs groupés par sous-domaine, chaque ligne avec nom, valeur, cible, écart, tendance, statut

## API

- `GET /api/indicators/domain?domain=OPERATIONNEL&year=...&quarter=...` — indicateurs du module

## Fichiers

```
src/components/cockpit/ModuleHeroSection.tsx
src/components/cockpit/KpiModuleView.tsx
src/components/cockpit/ModuleDocuments.tsx
```
