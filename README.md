# ANSUT Cockpit DG

Tableau de bord de pilotage pour la Direction Générale de l'Agence Nationale des Services Universels des Télécommunications (ANSUT).

## Stack technique

- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript
- **Base de données** : SQLite (via Prisma ORM)
- **Authentification** : next-auth v4 (JWT, credentials)
- **UI** : Tailwind CSS v4 + shadcn/ui + Sonner + Framer Motion
- **État** : Zustand (persist localStorage + serveur)
- **Exports** : PPTX (pptxgenjs), XLSX, PDF

## Prérequis

- Node.js ≥ 18
- npm

## Installation

```bash
npm install
cp .env.example .env   # ou éditer .env directement
npx prisma db push     # créer la base et les tables
npx tsx prisma/seed.ts # peupler les données de démo
npm run dev            # lancer en développement
```

## Variables d'environnement

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="<clé aléatoire>"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="<secret pour le cron de rapport>"
```

## Structure du projet

```
src/
├── app/
│   ├── api/               # Routes API (Next.js App Router)
│   │   ├── admin/         # Admin : CRUD users, roles, settings, etc.
│   │   ├── auth/          # next-auth, forgot/reset password
│   │   ├── cron/report    # Génération périodique de rapport (email)
│   │   ├── dashboard/     # Données du tableau de bord
│   │   ├── user/          # Profil, préférences, mot de passe
│   │   └── ...
│   ├── auth/              # Pages d'authentification
│   └── page.tsx           # Page principale cockpit
├── components/
│   ├── admin/             # Vue Administration
│   ├── auth/              # Login, reset password
│   ├── cockpit/           # Vue Cockpit DG (dashboard, KPIs, storytelling)
│   └── ui/                # Composants shadcn/ui
└── lib/
    ├── auth.ts            # Configuration next-auth
    ├── db.ts              # Client Prisma
    ├── email.ts           # Envoi d'emails (nodemailer)
    ├── store.ts           # Zustand store (état global)
    └── utils.ts           # Utilitaires
```

## Utilisateurs par défaut

| Email | Mot de passe | Rôle |
|---|---|---|
| admin@ansut.ci | ansut2025 | Administrateur |
| dg@ansut.ci | ansut2025 | DG |
| pmo@ansut.ci | ansut2025 | PMO |
| dfc@ansut.ci | ansut2025 | DFC |
| drh@ansut.ci | ansut2025 | DRH |
| dt@ansut.ci | ansut2025 | DT |
| djur@ansut.ci | ansut2025 | DJUR |
| agent@ansut.ci | ansut2025 | Agent |

## Fonctionnalités

- **Tableau de bord** : vue d'ensemble avec KPIs prioritaires (Lot 1)
- **Modules métier** : Gouvernance, Finance, Opérationnel, RH, Risque, PTA
- **Drag & drop** : réorganisation personnalisée des indicateurs (par utilisateur)
- **Storytelling** : présentation plein écran avec slides automatiques
- **Exports** : PPTX, PDF, Excel
- **Administration** : gestion des utilisateurs, rôles, indicateurs, paramètres
- **Sécurité** : timeout de session configurable, verrouillage après 5 tentatives, journalisation IP
- **Rapport périodique** : génération et envoi par email (cron), avec configuration SMTP
- **Mot de passe oublié** : reset par token avec expiration 1h
- **Profil utilisateur** : avatar, informations, changement de mot de passe
- **Thème** : mode clair/sombre

## Rapport périodique (cron)

Un endpoint `GET /api/cron/report?secret=<CRON_SECRET>` génère un rapport HTML et l'envoie par email selon la configuration SMTP dans les notifications. À appeler depuis un service externe (cron-job.org, systemd timer, etc.).

## Scripts

```bash
npm run dev        # Développement
npm run build      # Build production
npm run start      # Lancement production
npx prisma db push # Mise à jour de la base
npx prisma studio  # Interface Prisma
```
