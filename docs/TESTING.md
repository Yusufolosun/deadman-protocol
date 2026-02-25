# Testing Guide

This document covers how to run and write tests for the Deadman Protocol.

## Overview

The protocol uses **Vitest** with the **Clarinet SDK** to test all 14 Clarity smart contracts. Tests run against a simulated Stacks blockchain (simnet) with full contract deployment.

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Run a specific test file
npx vitest run tests/vault-core.test.ts

# Run tests matching a pattern
npx vitest run -t "should create vault"

# Verbose output
npx vitest run --reporter=verbose
```

## Test Structure

```
tests/
├── vault-core.test.ts              # Core vault CRUD operations
├── condition-engine.test.ts         # Condition evaluation logic
├── delegation-registry.test.ts      # Beneficiary/cosigner management
├── release-handler.test.ts          # Asset release mechanics
├── activity-tracker.test.ts         # Liveness ping tracking
├── admin-config.test.ts             # Protocol parameter management
├── deadman-access-control.test.ts   # Role-based permissions
├── deadman-emergency-stop.test.ts   # Emergency pause system
├── deadman-fee-vault.test.ts        # Fee collection tests
├── deadman-notification-logger.test.ts # Event logging
├── deadman-recovery.test.ts         # Recovery mechanisms
├── deadman-time-utils.test.ts       # Time calculation utilities
├── deadman-vault-extensions.test.ts # Vault metadata & top-ups
├── deadman-vault-registry.test.ts   # Global vault index
└── deep-integration.test.ts         # Cross-contract integration scenarios
```

## Test Setup

Each test file follows this pattern:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";
import { initSimnet } from "@hirosystems/clarinet-sdk";

let simnet: Awaited<ReturnType<typeof initSimnet>>;
let accounts: Map<string, string>;
let deployer: string;
let wallet1: string;

beforeEach(async () => {
  simnet = await initSimnet();
  accounts = simnet.getAccounts();
  deployer = accounts.get("deployer")!;
  wallet1 = accounts.get("wallet_1")!;
});
```

### Key Concepts

- **`simnet`** — A fresh simulated blockchain instance, reset before each test
- **`accounts`** — Pre-funded test accounts from `settings/Devnet.toml`
- **`Cl`** helper — Constructs Clarity values (`Cl.uint()`, `Cl.principal()`, `Cl.bool()`, etc.)
- **`simnet.callPublicFn()`** — Execute a public contract function
- **`simnet.callReadOnlyFn()`** — Execute a read-only function
- **`simnet.mineBlock()`** — Advance the chain by one block
- **`simnet.mineEmptyBlocks(n)`** — Advance the chain by `n` blocks

## Writing Tests

### Public Function Call

```typescript
it("should create a vault", () => {
  const result = simnet.callPublicFn(
    "deadman-vault-core-v2",
    "create-vault",
    [
      Cl.uint(1000000),   // amount in microSTX
      Cl.uint(1),         // condition type (1 = block-height)
      Cl.uint(150000),    // target block
      Cl.uint(0),         // inactivity threshold (unused for type 1)
      Cl.uint(0),         // approval threshold (unused for type 1)
      Cl.principal(wallet1), // beneficiary
    ],
    deployer
  );

  expect(result.result).toBeOk(Cl.uint(1)); // vault-id = 1
});
```

### Read-Only Function Call

```typescript
it("should read vault details", () => {
  // Create vault first...
  
  const result = simnet.callReadOnlyFn(
    "deadman-vault-core-v2",
    "get-vault",
    [Cl.uint(1)],
    deployer
  );

  expect(result.result).toBeSome(
    expect.objectContaining({
      type: expect.any(Number),
    })
  );
});
```

### Testing Error Cases

```typescript
it("should reject zero-amount vault", () => {
  const result = simnet.callPublicFn(
    "deadman-vault-core-v2",
    "create-vault",
    [Cl.uint(0), Cl.uint(1), Cl.uint(100), Cl.uint(0), Cl.uint(0), Cl.principal(wallet1)],
    deployer
  );

  expect(result.result).toBeErr(Cl.uint(101)); // err-invalid-amount
});
```

### Mining Blocks for Time-Based Tests

```typescript
it("should release after block height reached", () => {
  // Create a vault with target block = current + 10
  // ...
  
  // Advance past the target block
  simnet.mineEmptyBlocks(15);

  // Now release should succeed
  const release = simnet.callPublicFn(
    "deadman-vault-core-v2",
    "release-vault",
    [Cl.uint(1)],
    wallet1
  );

  expect(release.result).toBeOk(Cl.bool(true));
});
```

## Test Accounts

The simnet provides these pre-funded accounts (defined in `settings/Devnet.toml`):

| Account | Typical Role |
|---|---|
| `deployer` | Contract deployer, protocol admin |
| `wallet_1` | Primary test user (vault owner) |
| `wallet_2` | Beneficiary |
| `wallet_3` – `wallet_9` | Co-signers, additional users |

## Custom Matchers

The Clarinet SDK provides custom Vitest matchers:

| Matcher | Description |
|---|---|
| `toBeOk(value)` | Asserts `(ok value)` response |
| `toBeErr(value)` | Asserts `(err value)` response |
| `toBeSome(value)` | Asserts `(some value)` response |
| `toBeNone()` | Asserts `none` response |
| `toBeBool(bool)` | Asserts a boolean Clarity value |
| `toBeUint(n)` | Asserts `(uint n)` |
| `toBeInt(n)` | Asserts `(int n)` |
| `toBeAscii(str)` | Asserts an ASCII string |
| `toBePrincipal(addr)` | Asserts a principal value |

## Coverage

To generate a coverage report:

```bash
npx vitest run --coverage
```

Coverage reports are output to `coverage/` and are excluded from version control.

## CI Integration

Tests run automatically on every push and pull request via the GitHub Actions workflow in `.github/workflows/ci.yml`. The CI pipeline:

1. Checks all contracts compile (`clarinet check`)
2. Runs the full test suite (`npm test`)
3. Builds the frontend
4. Runs linting and formatting checks

## Troubleshooting

### Tests hang or timeout

- Ensure Clarinet is installed: `clarinet --version`
- Try running with `--no-threads` flag: `npx vitest run --no-threads`

### Contract not found errors

- Run `clarinet check` to verify all contracts compile
- Ensure `Clarinet.toml` lists all contract paths

### Stale simnet state

- Each test uses `beforeEach` to get a fresh simnet — avoid sharing state between tests
- If issues persist, clear any cached artifacts and re-run
