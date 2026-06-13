# Module Administration

**Menu sidebar** : Administration  
**Icône** : `Shield`  
**Clé** : `admin`

## Rôle

Interface d'administration complète du cockpit : gestion des utilisateurs, rôles, indicateurs, paramètres et supervision système.

## Accès

Réservé aux utilisateurs avec niveau de rôle ≥ 100 (administrateurs).

## Navigation

Barre de navigation horizontale (scrollable sur mobile) avec 12 onglets. La vue active est stockée dans `adminSubView` du store Zustand. Layout géré par `AdminLayout` (en-tête de navigation + zone de contenu unique).

## API

- Toutes les routes d'administration sont préfixées par `/api/admin/*`
- Protégées par `requireAdmin()` (renvoie 403 si niveau < 100)
- Journalisées dans `AuditLog` pour les opérations de modification

## Fichiers communs

```
src/components/admin/AdminLayout.tsx          # Layout avec navigation
src/components/admin/AdminDashboard.tsx       # Tableau de bord admin
src/components/admin/AdminUsers.tsx           # Gestion utilisateurs
src/components/admin/AdminRoles.tsx           # Gestion rôles
src/components/admin/AdminKPI.tsx             # Gestion indicateurs
src/components/admin/AdminDataSources.tsx     # Sources de données
src/components/admin/AdminSync.tsx            # Synchronisations
src/components/admin/AdminDocuments.tsx       # Documents
src/components/admin/AdminAlerts.tsx          # Alertes
src/components/admin/AdminLogs.tsx            # Journal d'audit
src/components/admin/AdminNotifications.tsx   # Notifications
src/components/admin/AdminSettings.tsx        # Paramètres
src/components/admin/AdminSecurity.tsx        # Sécurité
```

---

## 1. Tableau de bord

**Clé** : `admin_dashboard` · **API** : `GET /api/admin/dashboard-stats`

Vue d'ensemble avec statistiques globales (utilisateurs, rôles, indicateurs, modules), dernières connexions, alertes récentes, sources de données et accès rapides vers chaque sous-module.

---

## 2. Utilisateurs

**Clé** : `admin_users` · **API** : `GET/POST /api/admin/users`, `GET/PUT/DELETE /api/admin/users/[id]`

Gestion complète des utilisateurs : liste paginée (20/page) avec recherche et filtres (département, statut, rôle), création, édition (tous champs + avatar base64), activation/désactivation, verrouillage/déverrouillage (après 5 échecs), réinitialisation mot de passe.

---

## 3. Rôles & Permissions

**Clé** : `admin_roles` · **API** : `GET/POST /api/admin/roles`, `GET/PUT/DELETE /api/admin/roles/[id]`, `PUT /api/admin/permissions`

Hiérarchie : Administrateur (100) > DG (90) > PMO (80) > DFC/DRH/DT/DJUR (70) > Agent (10).

Permissions granulaires par module (`none`, `read`, `write`, `admin`) pour : `accueil`, `governance`, `finance`, `operational`, `rh`, `risque`, `pta`, `admin`.

Fonctionnalités : liste avec recherche, création/édition (nom, label, description, niveau, couleur), rôles système non supprimables, éditeur visuel de permissions, comptage des utilisateurs.

---

## 4. Indicateurs KPI

**Clé** : `admin_indicators` · **API** : `GET/POST /api/admin/indicators`, `GET/PUT/DELETE /api/admin/indicators/[id]`

### Structure

| Champ | Description |
|-------|-------------|
| name, description | Nom et description |
| domain | GOUVERNANCE, FINANCE, OPERATIONNEL, RH, RISQUE, PTA |
| subDomain | Sous-domaine |
| unit, targetValue | Unité et valeur cible |
| alertThreshold / criticalThreshold | Seuils d'alerte et critique (%) |
| currentValue, trend | Valeur actuelle et tendance (up/down/stable) |
| lot | 1 = prioritaire, 2 = secondaire |
| sortOrder, subDomainSort | Ordre d'affichage |
| archived | Archivé (caché) |

### Statuts calculés

- **Atteint** : écart ≤ alerte · **Partiel** : entre alerte et critique
- **Non atteint** : écart ≥ critique · **Sans valeur** : `currentValue === null`

Fonctionnalités : liste paginée avec recherche/filtres, création/édition, sous-domaines variables par module, suppression = archivage logique, statistiques.

---

## 5. Sources de données

**Clé** : `admin_datasources` · **API** : `GET/POST /api/admin/data-sources`, `GET/PUT/DELETE /api/admin/data-sources/[id]`

Types supportés : SharePoint, Base de données, Service web/API, Fichier (CSV, Excel). Liste avec nom/type/statut, création, test de connexion, badge coloré.

---

## 6. Synchronisations

**Clé** : `admin_sync` · **API** : `GET /api/admin/sync-logs`, `POST /api/admin/sync-logs`

Historique des synchronisations avec statut (succès/échec/en cours), date, source, lignes, messages d'erreur. Filtre par statut, relance manuelle, badge coloré.

---

## 7. Documents

**Clé** : `admin_documents` · **API** : `GET/POST /api/admin/documents`, `GET/PUT/DELETE /api/admin/documents/[id]`

Liens vers documents externes (SharePoint, OneDrive, Google Drive). Liste avec nom, description, URL, catégorie, badge de type. Filtres, comptage, CRUD complet.

---

## 8. Alertes

**Clé** : `admin_alerts` · **API** : `GET /api/admin/alerts`, `PATCH /api/admin/alerts/[id]`

Alertes système générées automatiquement (seuils dépassés, erreurs sync, etc.). Filtres par sévérité (info/warning/error), statut (active/resolved/dismissed), source. Résolution individuelle ou par lot.

---

## 9. Journal d'audit

**Clé** : `admin_logs` · **API** : `GET /api/admin/audit-logs`

### Actions journalisées

| Action | Déclencheur |
|--------|-------------|
| `create` / `update` / `delete` | CRUD entités |
| `login` / `login_failed` / `logout` | Connexion |
| `export` | Export PPTX/PDF/Excel |
| `reset_password` / `lock_user` / `unlock_user` | Sécurité |

Colonnes : date/heure, utilisateur, action, entité, statut, IP, métadonnées JSON. Pagination (50/page), filtres, vue détaillée.

---

## 10. Notifications

**Clé** : `admin_notifications` · **API** : `GET /api/admin/notifications`, `PATCH /api/admin/notifications/[id]`

Notifications système avec message, type (alerte/rapport/système), canal (email/in-app/les deux), statut de lecture. Statistiques total/lues/non lues, marquage comme lu.

---

## 11. Paramètres

**Clé** : `admin_settings` · **API** : `GET/PUT /api/admin/settings`

### Sections

- **Général** : nom app, logo URL, version, langue
- **Affichage** : thème, date référence, devise, séparateur décimal, format nombres
- **Notifications** : alertes email on/off, fréquence rapport, email destinataire
- **Sécurité** : politique mot de passe (Standard/Renforcé), expiration session (30min–24h), journalisation IP
- **Export** : templates PDF/PPTX/Excel, format défaut, inclure logo/date

Stockage : table `SystemSetting` (clé → valeur JSON). Seules les clés listées dans `PERSIST_KEYS` sont persistées.

---

## 12. Sécurité

**Clé** : `admin_security` · **API** : `GET /api/admin/settings`

Sessions actives (utilisateur, début, dernière activité, IP, durée), forcer déconnexion (une ou toutes), export CSV. Verrouillage automatique après 5 échecs, déverrouillage manuel. Politique mot de passe standard (≥6 car.) ou renforcé (≥8, maj, min, chiffre, spécial).
