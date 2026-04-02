# Senexus MultiAPP

> Plateforme SaaS modulaire multi-tenant pour la gestion des ressources humaines — conçue pour le secteur de l'intérim au Sénégal.

---

## À propos

**Senexus MultiAPP** est une application web centralisée développée pour le **Groupe Senexus**, composé de :

- **Connect'Intérim** — Agence de travail temporaire et externalisation RH
- **Synergie Pro** — Société multi-services
- **IPM Tawfeikh** — Institution de prévoyance maladie

La plateforme permet à chaque entité (appelée *firm*) de gérer ses ressources humaines de manière indépendante tout en partageant une infrastructure commune, avec une isolation stricte des données par tenant.

---

## Fonctionnalités principales

- 🏢 **Multi-tenancy** — Gestion isolée par entité avec switching entre firmes
- 📦 **Architecture modulaire** — Modules activables/désactivables par firm (RH, CRM, IPM...)
- 👥 **Gestion des employés** — CRUD complet, contrats, transferts, congés
- 📊 **Tableaux de bord BI** — KPIs et composants glissables par utilisateur
- 🔐 **Authentification & RBAC** — Rôles : OWNER, ADMIN, MANAGER, STAFF, VIEWER
- 📁 **Gestion documentaire** — Upload de fichiers via Zipline (auto-hébergé)
- 🎨 **Thème par firm** — Couleur d'interface personnalisée par entité

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript |
| UI | Shadcn UI + Tailwind CSS |
| Auth | NextAuth.js (JWT + Credentials) |
| ORM | Prisma ORM |
| Base de données | PostgreSQL |
| Hébergement | Coolify (VPS auto-hébergé) |
| Upload fichiers | Zipline (auto-hébergé) |

---

## Architecture des modules

Les modules sont auto-découverts depuis `src/modules/`. Chaque module est un dossier autonome contenant sa configuration, ses pages, ses composants et ses API routes.

```
src/modules/
├── hr/           # Module Ressources Humaines
│   ├── config.ts
│   ├── pages/
│   └── components/
├── crm/          # Module CRM (en cours)
└── types.ts      # Interfaces communes
```

L'activation d'un module pour une firm se fait via l'interface d'administration — sans modification du code core.

---

## Installation

### Prérequis

- Node.js 18+
- PostgreSQL
- pnpm (recommandé)

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/<votre-org>/senexus-multiapp.git
cd senexus-multiapp

# 2. Installer les dépendances
pnpm install

# 3. Configurer les variables d'environnement
cp env.example.txt .env
# Remplir les valeurs dans .env

# 4. Appliquer les migrations de base de données
pnpm prisma migrate deploy

# 5. Seeder les données initiales
pnpm db:seed

# 6. Lancer le serveur de développement
pnpm dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000).

---

## Variables d'environnement

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
ZIPLINE_URL=...
ZIPLINE_TOKEN=...
```

---

## Structure du projet

```
senexus-multiapp/
├── prisma/               # Schéma et migrations
├── src/
│   ├── app/              # Routes Next.js (App Router)
│   │   ├── [firmSlug]/   # Routes par firm
│   │   └── admin/        # Interface d'administration
│   ├── components/       # Composants UI partagés
│   ├── core/             # Module registry et logique core
│   ├── features/         # Fonctionnalités métier (auth, employees...)
│   ├── lib/              # Utilitaires (db, auth config...)
│   └── modules/          # Modules métier dynamiques
└── public/
```

---

## Statut du développement

| Module | Statut |
|---|---|
| Infrastructure core | ✅ Complet |
| Authentification & RBAC | ✅ Complet |
| Multi-tenancy | ✅ Complet |
| Système de modules | ✅ Complet (90%) |
| Module RH | 🔄 En cours |
| Module CRM | 🔄 En cours |
| Tableaux de bord BI | ✅ Fonctionnel |
| Gestion documentaire | ✅ Fonctionnel |

---

## Contexte académique

Ce projet constitue le support pratique du mémoire de Master en **Business Intelligence & Big Data** à l'**Institut Supérieur de Management (IAM)** de Dakar, intitulé :

> *"Conception et mise en œuvre d'une plateforme SaaS modulaire orientée Business Intelligence pour la gestion des ressources humaines"*

---

## Licence

Usage interne — Groupe Senexus. Tous droits réservés.
