# Contributing to Deadman Protocol

Thank you for your interest in contributing to the Deadman Protocol! This
document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch from `main`
4. Make your changes
5. Submit a pull request

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.x
- [Clarinet](https://github.com/hirosystems/clarinet) >= 2.x
- [Git](https://git-scm.com/)

### Smart Contracts

```bash
# Install test dependencies
npm install

# Verify contracts compile
clarinet check

# Run smart contract tests
npm test

# Watch mode for development
npm run test:watch
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start development server
npm run dev
```

## Project Structure

```
deadman-protocol/
├── contracts/          # Clarity smart contracts
├── tests/              # Contract test suites (Vitest + Clarinet SDK)
├── frontend/           # React + Vite frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # React hooks (auth, stacks, vault)
│   │   ├── lib/        # Contract helpers and Stacks utilities
│   │   ├── pages/      # Route page components
│   │   └── types/      # TypeScript type definitions
│   └── public/         # Static assets
├── docs/               # Architecture and technical documentation
├── settings/           # Clarinet network configurations
└── deployments/        # Deployment plans (gitignored)
```

## Making Changes

### Smart Contracts

- All contracts use Clarity version 2, epoch 2.5
- Follow existing naming conventions (e.g., `deadman-` prefix for new contracts)
- Define error codes within the contract's assigned range (see ARCHITECTURE.md)
- Add comprehensive tests for any new contract functions
- Run `clarinet check` before committing

### Frontend

- Use TypeScript strict mode
- Follow the existing component patterns (functional components with hooks)
- Use the `@/` path alias for imports
- Add CSS modules alongside components
- Use the design system variables from `index.css`

## Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/)
specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Description                                   |
| ---------- | --------------------------------------------- |
| `feat`     | A new feature                                 |
| `fix`      | A bug fix                                     |
| `docs`     | Documentation only changes                    |
| `style`    | Code style changes (formatting, semicolons)   |
| `refactor` | Code changes that neither fix bugs nor add features |
| `perf`     | Performance improvements                      |
| `test`     | Adding or updating tests                      |
| `chore`    | Build process or auxiliary tool changes        |
| `ci`       | CI/CD configuration changes                   |

### Scopes

- `contracts` — Clarity smart contracts
- `frontend` — React frontend application
- `tests` — Test suites
- `docs` — Documentation
- `deps` — Dependency updates

### Examples

```
feat(contracts): add partial release support to vault-core
fix(frontend): handle wallet disconnect during transaction
docs: update architecture diagram with new contracts
test(contracts): add edge case tests for condition-engine
chore(deps): update @stacks/transactions to v7.4.0
```

## Pull Request Process

1. Update documentation if your changes affect the public API
2. Add or update tests to cover your changes
3. Ensure `clarinet check` passes
4. Ensure `npm test` passes
5. Ensure the frontend builds: `cd frontend && npm run build`
6. Request review from a maintainer

### PR Title Format

Use the same conventional commit format for PR titles:

```
feat(contracts): add multi-token vault support
```

## Code Style

### Clarity (Smart Contracts)

- Use descriptive function names with kebab-case
- Document public functions with inline comments
- Use `define-read-only` for view functions
- Use `define-public` for state-changing functions
- Validate all inputs at the start of public functions

### TypeScript (Frontend)

- Use functional components with React hooks
- Use named exports for utilities, default exports for components
- Type all function parameters and return values
- Prefer `interface` over `type` for object shapes
- Use `const` assertions for constant objects

### CSS

- Use CSS custom properties from the design system
- Follow the glassmorphism design language
- Use the `glass` utility class for card-like surfaces
- Prefix animations with `animate-`

## Testing

### Contract Tests

Tests use Vitest with the Clarinet SDK simnet environment:

```typescript
import { describe, it, expect } from 'vitest'

describe('my-contract', () => {
  it('should do something', () => {
    // Test implementation
  })
})
```

### Running Tests

```bash
# All contract tests
npm test

# Specific test file
npx vitest run tests/vault-core.test.ts

# With cost reporting
npm run test:report
```

## Questions?

Open a GitHub Discussion or issue for questions about contributing.
