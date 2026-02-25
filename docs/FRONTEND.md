# Frontend Guide

The Deadman Protocol frontend is a React 19 single-page application built with Vite and TypeScript. It connects to the Stacks blockchain via `@stacks/connect` for wallet authentication and `@stacks/transactions` for contract interactions.

## Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 7 | Build tool and dev server |
| TypeScript | 5.9 | Type safety |
| @stacks/connect | 8 | Wallet authentication (Leather/Xverse) |
| @stacks/transactions | 7 | Clarity value construction, read-only calls |
| @stacks/network | 7 | Network configuration (testnet/mainnet) |
| react-router-dom | 7 | Client-side routing |
| lucide-react | — | Icon library |

## Directory Structure

```
frontend/src/
├── main.tsx                 # Entry point (providers, router)
├── App.tsx                  # Route definitions
├── App.css                  # Global styles and utility classes
├── index.css                # CSS custom properties (design tokens)
│
├── components/
│   ├── common/              # Reusable UI primitives
│   │   ├── Badge            # Status labels (success, warning, error)
│   │   ├── Button           # Action button with loading state
│   │   ├── Card             # Glass-morphism container
│   │   ├── Input            # Form input with validation
│   │   ├── Modal            # Overlay dialog
│   │   ├── Spinner          # Loading indicator
│   │   ├── Skeleton         # Content placeholder with shimmer
│   │   ├── Tooltip          # Hover information popup
│   │   ├── Tabs             # Tab navigation
│   │   ├── ConfirmDialog    # Destructive action confirmation
│   │   ├── EmptyState       # No-data placeholder
│   │   ├── AddressDisplay   # STX address with copy & explorer link
│   │   ├── NetworkIndicator # Testnet/Mainnet badge
│   │   ├── ErrorBoundary    # Error catch boundary
│   │   ├── ProtectedRoute   # Auth-gated route wrapper
│   │   └── index.ts         # Barrel exports
│   ├── layout/
│   │   ├── Layout           # Page shell (navbar + main)
│   │   └── Navbar           # Top navigation bar
│   └── vault/
│       └── VaultCard        # Vault summary card for lists
│
├── hooks/
│   ├── AuthContext.tsx       # Auth provider (Stacks wallet session)
│   ├── useAuth.ts           # Auth consumer hook
│   ├── useStacks.ts         # Read-only contract calls
│   ├── useVault.ts          # Write contract calls + vault fetching
│   ├── ToastContext.tsx      # Toast notification provider
│   ├── useToast.ts          # Toast consumer hook
│   ├── useTransactionTracker.ts  # TX status polling
│   └── useBlockHeight.ts    # Current block height polling
│
├── lib/
│   ├── stacks.ts            # Network config, contract owner, app details
│   ├── contracts.ts         # Contract call parameter builders
│   ├── constants.ts         # Protocol constants and labels
│   ├── format.ts            # STX formatting, block time estimation
│   ├── validation.ts        # Address and amount validators
│   ├── clipboard.ts         # Clipboard API wrapper
│   ├── explorer.ts          # Stacks Explorer URL builders
│   ├── storage.ts           # localStorage helpers
│   ├── api.ts               # Stacks API client (balances, tx status)
│   └── index.ts             # Barrel exports
│
├── pages/
│   ├── Landing              # Marketing homepage
│   ├── Dashboard            # User vault listing with search/filter
│   ├── CreateVault          # Multi-step vault creation wizard
│   ├── VaultDetail          # Single vault view with actions
│   ├── Activity             # Liveness ping management
│   ├── Approvals            # Co-signer approval queue
│   ├── Settings             # Protocol config & network info
│   └── NotFound             # 404 page
│
└── types/
    ├── vault.ts             # Vault, VaultDisplay, ProtocolConfig, etc.
    └── index.ts             # Barrel re-exports
```

## Architecture

### Authentication Flow

1. User clicks "Connect Wallet" in the Navbar
2. `AuthContext` calls `showConnect()` from `@stacks/connect`
3. Leather/Xverse wallet opens authentication popup
4. On success, `UserSession` stores the session locally
5. `useAuth()` exposes `isConnected`, `stxAddress`, `connect()`, `disconnect()`
6. `ProtectedRoute` redirects unauthenticated users to Landing

### Contract Interaction Pattern

**Write operations** (create vault, cancel, release, ping):

```
useVault hook  →  contracts.ts (build params)  →  openContractCall()  →  Wallet signs TX
```

**Read operations** (get vault data, config):

```
useStacks hook  →  fetchCallReadOnlyFunction()  →  cvToValue()  →  Return JS value
```

### State Management

The app uses React's built-in state management:

- **AuthContext** — Global wallet session state
- **ToastContext** — Global toast notification state
- **Component state** — Local `useState` for page-specific data
- **No external state library** — Sufficient for current complexity

## Design System

### Theme

The frontend uses a dark theme with glassmorphism effects, defined via CSS custom properties in `index.css`:

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#050507` | Page background |
| `--bg-secondary` | `#0a0a0f` | Card backgrounds |
| `--primary` | `#6366f1` | Primary accent (indigo) |
| `--success` | `#10b981` | Success states |
| `--warning` | `#f59e0b` | Warning states |
| `--error` | `#ef4444` | Error states |
| `--text-primary` | `rgba(255,255,255,0.95)` | Main text |
| `--text-secondary` | `rgba(255,255,255,0.6)` | Secondary text |

### Typography

- **Headings**: `Outfit` (Google Fonts)
- **Body**: `Inter` (Google Fonts)

### Glass Effect

Cards and containers use the `.glass` class:

```css
.glass {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
}
```

### Responsive Breakpoints

| Breakpoint | Target |
|---|---|
| `≤ 640px` | Mobile |
| `≤ 850px` | Tablet |
| `≤ 992px` | Small desktop |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_NETWORK` | Yes | `testnet` or `mainnet` |
| `VITE_CONTRACT_ADDRESS` | Yes | Deployer STX address |

These are prefixed with `VITE_` so Vite exposes them to the client bundle.

## Development

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Type check (no emit)
npx tsc -b

# Lint
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

### TypeScript Configuration

The project uses strict TypeScript with these notable settings:

- `verbatimModuleSyntax` — Requires `import type` for type-only imports
- `erasableSyntaxOnly` — Only allows erasable TypeScript syntax
- `noUnusedLocals` / `noUnusedParameters` — Enforces clean imports
- Path alias `@/*` maps to `./src/*`

### Adding a New Page

1. Create `src/pages/MyPage.tsx` and `src/pages/MyPage.css`
2. Add a route in `App.tsx`:
   ```tsx
   <Route path="/my-page" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
   ```
3. Add a navigation link in `Navbar.tsx`

### Adding a New Component

1. Create `src/components/common/MyComponent.tsx` and `.css`
2. Export from `src/components/common/index.ts`
3. Import via `import { MyComponent } from '@/components/common'`

### Adding a Contract Interaction

1. Add the function builder to `src/lib/contracts.ts`
2. For write calls, add a wrapper in `useVault.ts`
3. For read calls, add a wrapper in `useStacks.ts`

## Build & Deployment

```bash
# Production build (outputs to frontend/dist/)
npm run build

# The dist/ folder can be deployed to any static host
# See docs/DEPLOYMENT.md for full deployment instructions
```

For SPA routing, configure your host to redirect all paths to `index.html`. See the [Deployment Guide](DEPLOYMENT.md) for examples with Nginx, Vercel, and Netlify.
