# Deadman Protocol — Contract Architecture

## Overview

The protocol is composed of fourteen Clarity smart contracts (3 unchanged, 3 V2
redeployments, 8 new), each with a single, well-defined responsibility. Contracts
communicate through explicit inter-contract calls. No contract holds
responsibilities outside its domain.

## Contracts

### Unchanged Contracts (no redeployment needed)

#### admin-config
Stores protocol-level configuration: minimum vault duration (in blocks),
maximum co-signer count, protocol pause flag. Controlled exclusively by
the deployer address.

#### activity-tracker
Records the last-seen block height for any principal who pings it. Used by
condition-engine to evaluate inactivity-based triggers.

#### condition-engine
Evaluates whether a vault's trigger conditions have been met. Supports three
condition types: block-height threshold, inactivity period (via activity-tracker),
and M-of-N co-signer approval.

### V2 Redeployments (modified contracts under new names)

#### deadman-vault-core-v2
The primary entry point. Users create and manage vaults here. Holds deposited STX
and transfers them directly to beneficiaries upon release. Orchestrates delegation,
fee collection, and vault registration. Tracks vault status as active (0),
released (1), or cancelled (2).

#### deadman-delegation-registry-v2
Stores beneficiary and co-signer designations for each vault. Enforces uniqueness
(duplicate co-signers are rejected) and prevents self-delegation.

#### deadman-release-handler-v2
Standalone STX release utility retained for potential future extensions (e.g.
partial releases, multi-token support). Not currently invoked by vault-core-v2.

### New Contracts

#### deadman-fee-vault
Protocol fee collection. Collects a configurable fee (basis points, default 0.5%)
on vault creation. Accumulated fees can be withdrawn by the deployer.

#### deadman-vault-registry
Global vault index for tracking and querying vaults across the protocol. Maintains
counts by status and provides beneficiary reverse lookups.

#### deadman-notification-logger
Centralized protocol event logging. Provides a sequential event log with IDs for
off-chain indexers and analytics.

#### deadman-vault-extensions
Optional vault metadata (name, category). Vault owners call this contract directly
to attach metadata. Verifies ownership via vault-core-v2.

#### deadman-time-utils
Block-time estimation utilities. Pure read-only functions for converting between
block counts and approximate real-world time (10 min/block on Stacks).

#### deadman-access-control
Role-based access control. Defines roles (admin, operator, guardian) and manages
assignments. Deployer has implicit admin privileges.

#### deadman-emergency-stop
Guardian-based emergency controls. Multiple guardians can vote to activate
emergency mode. Uses vote rounds that reset on resolution. Includes cooldown
period before emergency can be resolved.

#### deadman-recovery
Recovery mechanisms for failed or stuck vault releases. Vault owners or deployer
can submit recovery requests. Deployer resolves (approve or reject).

## Call Flow
```
User → deadman-vault-core-v2 (create-vault)
  └─→ deadman-fee-vault (collect-fee)
  └─→ deadman-delegation-registry-v2 (set-beneficiary)
  └─→ deadman-vault-registry (register-vault)
  └─→ activity-tracker (ping) [inactivity vaults only]
User → activity-tracker (ping)
User → deadman-vault-core-v2 (add-cosigner)
  └─→ deadman-delegation-registry-v2 (add-cosigner)
Co-signer → deadman-vault-core-v2 (submit-approval)
  └─→ deadman-delegation-registry-v2 (submit-approval)
Anyone → deadman-vault-core-v2 (trigger-release)
  └─→ condition-engine (evaluate-condition)
  └─→ deadman-delegation-registry-v2 (get-beneficiary)
  └─→ deadman-vault-registry (update-vault-status)
  └─→ STX transfer to beneficiary
Owner → deadman-vault-core-v2 (cancel-vault)
  └─→ deadman-vault-registry (update-vault-status)
  └─→ STX refund to owner
Owner → deadman-vault-extensions (set-vault-metadata)
Owner → deadman-recovery (request-recovery)
Guardian → deadman-emergency-stop (vote-emergency-stop)
```

## Error Code Ranges

| Contract                        | Range       |
|---------------------------------|-------------|
| admin-config                    | u100–u101   |
| deadman-delegation-registry-v2  | u300–u306   |
| condition-engine                | u400        |
| deadman-release-handler-v2      | u500–u503   |
| deadman-vault-core-v2           | u601–u611   |
| deadman-fee-vault               | u700–u703   |
| deadman-vault-registry          | u800–u803   |
| deadman-notification-logger     | u900        |
| deadman-vault-extensions        | u1000–u1001 |
| deadman-access-control          | u1200–u1202 |
| deadman-emergency-stop          | u1300–u1305 |
| deadman-recovery                | u1400–u1405 |

## Security Constraints

- admin-config is write-restricted to deployer
- delegation-registry-v2, fee-vault, vault-registry, notification-logger, and
  release-handler-v2 use the authorized-caller pattern
- No contract stores private keys or seeds
- All inter-contract calls use fully qualified principal references
- Duplicate co-signers are rejected at registration time
- Emergency stop uses vote rounds with cooldown periods
- Fee rate is capped at 10% (1000 bps)
