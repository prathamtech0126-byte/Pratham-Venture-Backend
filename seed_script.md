# Backend scripts reference

All commands run from this folder:

```powershell
cd "Admin  Backend\pratham-ventures-admin\backend"
```

---

## npm scripts (`package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| **dev** | `npm run dev` | Start development server with hot reload (`ts-node-dev`, port from `.env`) |
| **build** | `npm run build` | Generate Prisma client + compile TypeScript to `dist/` |
| **start** | `npm run start` | Run production server (`node dist/index.js`) |
| **seed** | `npm run seed` | Seed sites, companies, designations, and admin user |
| **seed:hr** | `npm run seed:hr` | Create the 6 HR (Pratham International) letterhead companies, each with the 44 designations + job descriptions from `src/data/hrJobDescriptions.json`. Safe to re-run: never overwrites a JD HR edited, never restores a designation HR deleted |
| **create-user** | `npm run create-user -- <email> <password> <ADMIN\|HR\|SUPER_ADMIN>` | Create a panel user (or reset an existing user's password/role). HR users share the HR workspace and cannot see Admin data or contact submissions. SUPER_ADMIN switches between both workspaces and manages users from the **Users** page |
| **prisma:migrate** | `npm run prisma:migrate` | Create/apply migrations in dev (`prisma migrate dev`) |
| **prisma:generate** | `npm run prisma:generate` | Regenerate Prisma client after schema changes |
| **prisma:deploy** | `npm run prisma:deploy` | Apply pending migrations on production/staging |

---

## Seed script

**Source file:** `src/seed.ts`  
**Run:**

```powershell
npm run seed
```

Prisma also runs the same seed after `prisma migrate dev` / `prisma db seed` (configured in `package.json` → `"prisma"."seed"`).

### Required `.env` variables

| Variable | Example | Used for |
|----------|---------|----------|
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/pratham_ventures_admin?schema=public` | Database connection |
| `ADMIN_EMAIL` | `admin@prathamtech.com` | Admin login email (upserted) |
| `ADMIN_PASSWORD` | `Pratham@419` | Admin password (bcrypt hash stored) |

### What the seed creates

1. **Sites** (4) — contact form sources  
   - Inkline Digital Solutions  
   - Prarambh Manufacturing  
   - Aarogya Path Wellness  
   - Dear Stranger Café  

2. **Companies + designations** (4 companies, 67 designations total)  
   - Inkline Digital Solutions — 19 designations  
   - Prarambh Manufacturing Pvt. Ltd. — 17 designations  
   - Aarogya Path Wellness Center — 16 designations  
   - Dear Stranger Café — 15 designations  

3. **Admin user** — upserts `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`  
   - Existing admin with same email → password hash is **updated**  
   - Does not remove other admin rows

### Seed behaviour notes

- Safe to re-run: uses `upsert` / find-or-create (does not wipe existing data)
- Soft-deleted companies/designations are **restored** if matched by name
- Does **not** seed employees, offer letters, salary slips, or other documents

---

## Common workflows

### First-time local setup

```powershell
npm install
npm run prisma:deploy
npm run prisma:generate
npm run seed
npm run dev
```

### Reset admin password (local)

1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`
2. Run:

```powershell
npm run seed
```

### After changing Prisma schema

```powershell
npm run prisma:migrate
npm run prisma:generate
```

### Production deploy

```powershell
npm run build
npm run prisma:deploy
npm run start
```

Optional seed on fresh DB only:

```powershell
npm run seed
```

---

## All scripts (copy-paste)

```powershell
# Development
npm run dev

# Build & production
npm run build
npm run start

# Database
npm run prisma:migrate
npm run prisma:generate
npm run prisma:deploy

# Seed
npm run seed
```

---

## File locations

| File | Purpose |
|------|---------|
| `src/seed.ts` | Seed logic |
| `src/prisma/` | Prisma schema + migrations |
| `.env` | Local environment (not committed) |
| `.env.example` | Environment template |
| `package.json` | npm script definitions |
