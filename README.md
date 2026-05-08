# LandChain Registry

A blockchain-anchored land registry **proof of concept** built with React, Vite and TanStack Start. Citizens, registry officers and administrators register parcels, transfer ownership and publicly verify records — every change is hashed and "anchored" on a simulated ledger so the chain of custody is tamper-evident.

> **POC scope** — the backend is mocked entirely in the browser (in-memory + `localStorage`). The UI talks to a thin **service layer** so the swap to a real HTTP/blockchain backend is a one-file change per module.

---

## Tech stack

- **React 19** + **TypeScript** (strict)
- **Vite 7** + **TanStack Start** (file-based routing, SSR-ready)
- **Tailwind CSS v4** (tokens defined in `src/styles.css` using `oklch`)
- **shadcn/ui** primitives (Radix under the hood)
- **Zod** for form validation
- **Sonner** for toasts
- **lucide-react** for icons
- **bun** as package manager

---

## Quick start

```bash
bun install
bun run dev
```

The app runs at the URL printed by Vite. The mock backend seeds three demo accounts and three demo parcels on first load.

### Demo accounts

| Role          | Email                          | Password      |
| ------------- | ------------------------------ | ------------- |
| Administrator | `admin@landregistry.gov`       | `Admin@123`   |
| Land officer  | `officer@landregistry.gov`     | `Officer@123` |
| Citizen       | `citizen@example.com`          | `Citizen@123` |

> All data lives in `localStorage`. To reset, open DevTools → Application → Local Storage → clear the `lr.*` keys (or just clear the site's storage).

---

## Design system — *Emerald Prestige*

- **Heading font:** Urbanist · **Body font:** Epilogue (loaded from Google Fonts in `src/styles.css`)
- **Palette:** deep emerald (`--primary`), warm cream background, gold accents (`--gold`)
- **Tokens:** all colors, gradients and shadows are CSS variables in `:root` / `.dark`. Never hardcode colors in components — always use semantic tokens (`bg-primary`, `text-foreground`, `bg-[image:var(--gradient-emerald)]`, `shadow-[var(--shadow-elegant)]`, etc.)

---

## Project structure

```
src/
├── routes/                       # File-based routes (TanStack Router)
│   ├── __root.tsx                # Root shell + AuthProvider + Toaster
│   ├── index.tsx                 # Public landing page
│   ├── login.tsx / register.tsx  # Auth pages
│   ├── dashboard.tsx             # Authenticated home
│   ├── lands.index.tsx           # /lands  — registry list
│   ├── lands.new.tsx             # /lands/new  — register parcel (officer/admin)
│   ├── lands.$landId.tsx         # /lands/:id — parcel detail + chain of custody
│   ├── transfers.index.tsx       # /transfers — transfer ledger
│   ├── transfers.new.tsx         # /transfers/new — initiate transfer
│   ├── transfers.$transferId.tsx # /transfers/:id — approve / reject / cancel
│   ├── verify.tsx                # /verify  — PUBLIC blockchain verification
│   └── admin.users.tsx           # /admin/users — user management (admin only)
│
├── components/
│   ├── auth/        AuthShell, ProtectedRoute
│   ├── layout/      AppLayout, Navbar, Sidebar
│   ├── lands/       StatusBadge
│   ├── transfers/   TransferStatusBadge
│   ├── blockchain/  HashChip (copyable tx/block hash chip)
│   └── ui/          shadcn primitives
│
├── context/
│   └── AuthContext.tsx           # Session state, login/register/logout, hasRole()
│
├── lib/
│   ├── auth/types.ts             # Role, User, AuthSession, LoginPayload…
│   ├── lands/types.ts            # LandRecord, BlockchainAnchor, LandHistoryEvent…
│   ├── transfers/types.ts        # TransferRecord, TransferStatus…
│   └── utils.ts                  # cn() helper
│
├── services/                     # ⭐ The swap point for the real backend
│   ├── authService.ts            # login / register / session / hasRole
│   ├── landService.ts            # list / getById / getByParcel / register + _landMutators
│   ├── transferService.ts        # initiate / approve / reject / cancel
│   └── userService.ts            # list / setRole / remove (admin)
│
├── styles.css                    # Tailwind v4 + Emerald Prestige tokens
├── router.tsx                    # createRouter()
└── routeTree.gen.ts              # AUTO-GENERATED — do not edit
```

---

## Modules shipped so far

### 1. Authentication & layout (foundation)

- Email/password login + registration with role selection (`citizen`, `land_officer`, `admin`)
- Session persisted in `localStorage` with 8h TTL
- `<ProtectedRoute roles={[...]}>` wraps every authenticated screen and renders the shared `AppLayout` (Navbar + role-aware Sidebar)
- `useAuth()` hook exposes `user`, `isAuthenticated`, `hasRole(...)`, `login`, `register`, `logout`

### 2. Land Registry

- `/lands` — searchable, status-filtered table; counts cards; citizens see only their own parcels, officers/admins see everything
- `/lands/new` — Zod-validated registration form (officer/admin only); on submit the record is hashed and an initial anchor is appended to history
- `/lands/$landId` — "certificate" header on the gradient hero with tx hash, block hash, block number and network; full chain-of-custody timeline

### 3. Ownership Transfer

- `/transfers` — ledger of all transfer requests (filtered by role) with summary cards
- `/transfers/new` — initiate a transfer for a parcel you own (or any registered parcel if you're staff). Initiation flips the parcel to `pending_transfer` and writes an **initiation anchor**.
- `/transfers/$transferId` — approve / reject / cancel:
  - **Approve** (officer/admin) → land's `ownerName` / `ownerNationalId` are rewritten, a `transferred` event is appended to the chain of custody, a fresh **settlement anchor** is created, and the parcel returns to `registered`.
  - **Reject** (officer/admin, reason required) → parcel returns to `registered`, transfer closed.
  - **Cancel** (initiator only) → parcel returns to `registered`, transfer closed.
- Two-anchor audit trail: `initiationAnchor` always present, `settlementAnchor` present iff the transfer was approved.

### 4. Blockchain Verification (public, no login)

- `/verify` — anyone can audit a parcel:
  - Lookup **by parcel number**
  - Lookup **by transaction hash** — matches against either the registration anchor or any history-event anchor
- Returns a "Verified on-chain" certificate with the matched anchor type, current owner, status and a deep link to the full record
- Designed to be linkable from external systems (notaries, courts, etc.)

### 5. Admin User Management

- `/admin/users` — admin-only console (guarded by `<ProtectedRoute roles={["admin"]}>`)
- Inline role select per user (Administrator / Land officer / Citizen) with optimistic toast feedback
- Delete with `AlertDialog` confirmation
- Self-protection: an admin cannot demote or delete their own account
- Search across name / email / national ID / role

---

## The service-layer contract

Every screen talks to a service object — never directly to `localStorage` or `fetch`. The contract is:

```ts
// Example: src/services/landService.ts
export const landService = {
  list(): Promise<LandRecord[]>,
  listForUser(user: User | null): Promise<LandRecord[]>,
  getById(id: string): Promise<LandRecord | null>,
  getByParcel(parcelNumber: string): Promise<LandRecord | null>,
  register(payload: RegisterLandPayload, actor: User): Promise<LandRecord>,
};
```

Every method is `async` and returns a `Promise`. To wire the real backend, replace each function body with a `fetch(...)` call (and drop the `localStorage` helpers + `seed()`). **No UI code needs to change.**

### Cross-service mutations

`transferService.approve()` needs to mutate the land record. Rather than letting the UI orchestrate that, `landService` exports an `_landMutators` namespace (`setStatus`, `applyTransfer`) that `transferService` calls directly. This keeps every land-record write in one file — when you swap to a real backend, this is also the only file you'll need to touch for land updates.

### Storage keys (mock backend)

| Key                  | Owner            | Contents                                         |
| -------------------- | ---------------- | ------------------------------------------------ |
| `lr.users.v1`        | `authService`    | All registered users (incl. seed accounts)       |
| `lr.session.v1`      | `authService`    | Current session token + user + `expiresAt`       |
| `lr.lands.v1`        | `landService`    | All land records with embedded history & anchors |
| `lr.lands.seeded.v1` | `landService`    | Marker so seed runs once                         |
| `lr.transfers.v1`    | `transferService`| All transfer requests                            |

### Mock anchor shape

```ts
interface BlockchainAnchor {
  txHash: string;       // 0x + 64 hex chars
  blockHash: string;    // 0x + 64 hex chars
  blockNumber: number;  // 1_840_000–1_890_000 range
  network: "LandChain Testnet";
  timestamp: string;    // ISO
}
```

Hashes are generated with `crypto.getRandomValues` so they look real but carry no on-chain meaning. When integrating a real chain, replace `makeAnchor()` in `landService.ts` and `transferService.ts` with the actual transaction receipt.

---

## Routing conventions (TanStack Start)

- File-based routing in `src/routes/` using **flat dot-separated** filenames (e.g. `lands.$landId.tsx` → `/lands/:landId`).
- `src/routeTree.gen.ts` is **auto-generated** by the Vite plugin — never edit it by hand.
- Use imports from `@tanstack/react-router` (NOT `react-router-dom`):
  ```tsx
  import { Link, useNavigate, useParams, createFileRoute } from "@tanstack/react-router";
  ```
- Every route file sets a `head()` with title + meta description for SEO.

---

## Adding a new authenticated page

1. Create `src/routes/your-page.tsx`:
   ```tsx
   import { createFileRoute } from "@tanstack/react-router";
   import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

   export const Route = createFileRoute("/your-page")({
     head: () => ({ meta: [{ title: "Your page — LandChain" }] }),
     component: () => (
       <ProtectedRoute roles={["admin", "land_officer"]}>
         <YourPageInner />
       </ProtectedRoute>
     ),
   });

   function YourPageInner() { /* ... */ }
   ```
2. Add a link in `src/components/layout/Sidebar.tsx` (with `roles` if needed).
3. Save — the route tree regenerates automatically.

---

## Adding a new service

1. Define the data types in `src/lib/<feature>/types.ts`.
2. Create `src/services/<feature>Service.ts` exporting an object with `async` methods.
3. If the new service needs to mutate another resource, expose an `_<resource>Mutators` namespace from the owning service (see how `transferService` calls `_landMutators`) — never reach into another service's storage directly.

---

## Conventions & guardrails

- **Roles** are part of the user record (POC). In production this MUST move to a separate `user_roles` table on the server with a `has_role()` security-definer function — see Lovable's user-roles guideline. Never trust client-side role checks for authorization in a real backend.
- **Validation** uses Zod schemas at the form boundary. Server-side validation must be re-applied when the real backend is wired.
- **Design tokens only** — no raw `text-white` / `bg-black` in components; use semantic classes (`text-foreground`, `bg-primary`, etc.).
- **Strict TypeScript** — every import must resolve. Create files before importing them.
- **No `any`** unless absolutely necessary.
- Keep components focused. Extract to `src/components/<feature>/` when they're reused.

---

## Roadmap / next steps

- [ ] Disputes module (raise, investigate, resolve) with its own anchor trail
- [ ] PDF export of the parcel certificate
- [ ] Map view for parcels (Mapbox / Leaflet)
- [ ] Replace the mock backend with a real REST/GraphQL API and a real chain (e.g. Polygon, Hyperledger Fabric)
- [ ] Move user roles to a server-side table with RLS
- [ ] Notifications (email/in-app) on transfer state changes
- [ ] Audit log for admin actions

---

## Working together

- The repo syncs **bidirectionally with Lovable** — anything you push to `main` shows up in the Lovable editor automatically, and vice versa.
- Use feature branches + PRs for non-trivial work; small fixes can go straight to `main`.
- When adding a feature: types → service → route(s) → sidebar link → README update.
- If you reset your local storage and the seed data doesn't reappear, hard-refresh — `seed()` only runs when the relevant key is missing.

Happy building.
