# Deadman Protocol

[![CI](https://github.com/YOUR_ORG/deadman-protocol/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/deadman-protocol/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Clarity](https://img.shields.io/badge/Clarity-v2-orange.svg)](https://docs.stacks.co/clarity)
[![Stacks](https://img.shields.io/badge/Stacks-Epoch%202.5-purple.svg)](https://www.stacks.co/)

A generalized on-chain trust delegation and conditional transfer protocol built on [Stacks](https://www.stacks.co/). Deadman enables principals to create vaults that hold STX and define verifiable on-chain conditions under which those vaults release — using only block height, principal activity, and co-signer thresholds. **No oracles. No off-chain dependencies.**

---

## Features

- **Dead Man's Switch** — Release assets automatically if no activity for N blocks
- **Time-Locked Transfer** — Release STX after a target block height
- **Threshold Approval** — Require M-of-N co-signer approvals before release
- **Emergency Stop** — Protocol-level pause for security incidents
- **Fee Vault** — Protocol fee collection and management
- **Notification Logger** — On-chain event logging for off-chain indexers
- **Vault Extensions** — Extensible vault metadata and top-up support

## Smart Contracts

The protocol consists of **14 Clarity smart contracts** working together:

| Contract | Purpose |
|---|---|
| `deadman-vault-core-v2` | Main entry point — vault creation, release, cancellation |
| `condition-engine` | Evaluates block-height, inactivity, and threshold conditions |
| `deadman-delegation-registry-v2` | Stores beneficiary and co-signer designations |
| `delegation-registry` | Legacy delegation storage (v1 compatibility) |
| `activity-tracker` | Records last-active block for inactivity checks |
| `deadman-release-handler-v2` | Standalone release utility with fee integration |
| `admin-config` | Protocol parameters (min lock, max cosigners, pause) |
| `deadman-access-control` | Role-based access management |
| `deadman-emergency-stop` | Emergency pause mechanism |
| `deadman-fee-vault` | Fee collection and withdrawal |
| `deadman-notification-logger` | On-chain event logging |
| `deadman-recovery` | Recovery mechanisms for stuck vaults |
| `deadman-time-utils` | Block time estimation utilities |
| `deadman-vault-extensions` | Vault metadata and top-up support |
| `deadman-vault-registry` | Global vault index and statistics |

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Clarity v2 (Stacks, epoch 2.5) |
| Contract Tooling | [Clarinet](https://github.com/hirosystems/clarinet) |
| Frontend | React 19 + Vite 7 + TypeScript 5.9 |
| Wallet Integration | @stacks/connect v8 + @stacks/transactions v7 |
| Routing | react-router-dom v7 |
| Icons | lucide-react |
| Testing | Clarinet SDK + Vitest |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Clarinet](https://github.com/hirosystems/clarinet) ≥ 2.x
- A Stacks wallet (e.g. [Leather](https://leather.io/))

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_ORG/deadman-protocol.git
cd deadman-protocol

# Install contract test dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Development

#### Contracts

```bash
# Check all contracts compile
clarinet check

# Run all tests (124+ tests across 15 test suites)
npm test

# Watch mode
npm run test:watch
```

#### Frontend

```bash
cd frontend

# Start dev server (http://localhost:5173)
npm run dev

# Type check
npx tsc -b

# Lint
npm run lint

# Build for production
npm run build
```

### Environment Configuration

Copy the example environment file for the frontend:

```bash
cp frontend/.env.example frontend/.env.local
```

Required variables:

| Variable | Description |
|---|---|
| `VITE_NETWORK` | `testnet` or `mainnet` |
| `VITE_CONTRACT_OWNER` | Deployer address (e.g. `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`) |

## Project Structure

```
├── contracts/          # 14 Clarity smart contracts
├── tests/              # Vitest + Clarinet SDK test suites
├── frontend/           # React 19 SPA
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # React hooks (auth, vault, stacks)
│   │   ├── lib/        # Utility modules (format, validation, api)
│   │   ├── pages/      # Route pages
│   │   └── types/      # TypeScript type definitions
│   └── public/         # Static assets
├── docs/               # Documentation
├── settings/           # Clarinet network configs
├── deployments/        # Deployment plans
└── .github/            # CI/CD workflows and issue templates
```

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System design, contract interactions, data flow |
| [API Reference](docs/API.md) | Complete smart contract function reference |
| [Frontend Guide](docs/FRONTEND.md) | Frontend architecture, components, and design system |
| [Testing Guide](docs/TESTING.md) | How to run and write tests |
| [Deployment Guide](docs/DEPLOYMENT.md) | Testnet/mainnet deployment instructions |
| [Contributing](CONTRIBUTING.md) | Development workflow and coding standards |
| [Security Policy](SECURITY.md) | Vulnerability reporting guidelines |
| [Changelog](CHANGELOG.md) | Version history and release notes |

## Security

> **Warning**: This protocol is in active development and has **not** undergone a formal security audit. Do not use with significant funds on mainnet until audited.

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidelines.

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
