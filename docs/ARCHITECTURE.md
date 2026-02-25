# Deadman Protocol — Contract Architecture

## Overview

The protocol is composed of six Clarity smart contracts, each with a single,
well-defined responsibility. Contracts communicate through explicit inter-contract
calls. No contract holds responsibilities outside its domain.

## Contracts

### deadman-vault-core
The primary entry point. Users create and manage vaults here. Holds deposited STX
and transfers them directly to beneficiaries upon release. Orchestrates all other
contracts. Tracks vault status as active (0), released (1), or cancelled (2).

### condition-engine
Evaluates whether a vault's trigger conditions have been met. Supports three
condition types: block-height threshold, inactivity period (via activity-tracker),
and M-of-N co-signer approval. Returns a boolean to vault-core.

### delegation-registry
Stores beneficiary and co-signer designations for each vault. Tracks who has been
designated as a beneficiary or co-signer. Enforces uniqueness (duplicate co-signers
are rejected) and prevents self-delegation.

### activity-tracker
Records the last-seen block height for any principal who pings it. Used by
condition-engine to evaluate inactivity-based triggers without off-chain data.
Automatically pinged when creating inactivity-type vaults.

### release-handler
Standalone STX release utility retained for potential future extensions (e.g.
partial releases, multi-token support). Not currently invoked by vault-core —
STX transfers happen directly within vault-core's `trigger-release` function.

### admin-config
Stores protocol-level configuration: minimum vault duration (in blocks),
maximum co-signer count, protocol pause flag. Controlled exclusively by
the deployer address. No upgrade proxy pattern — values are simple data vars.

## Call Flow
```
User → deadman-vault-core (create-vault)
  └─→ delegation-registry (set-beneficiary)
  └─→ activity-tracker (ping) [inactivity vaults only]
User → activity-tracker (ping)
User → deadman-vault-core (add-cosigner)
  └─→ delegation-registry (add-cosigner)
Co-signer → deadman-vault-core (submit-approval)
  └─→ delegation-registry (submit-approval)
Anyone → deadman-vault-core (trigger-release)
  └─→ condition-engine (evaluate-condition)
  └─→ delegation-registry (get-beneficiary)
  └─→ STX transfer to beneficiary
Owner → deadman-vault-core (cancel-vault)
  └─→ STX refund to owner
```

## Security Constraints

- admin-config is write-restricted to deployer
- delegation-registry and release-handler use authorized-caller pattern
- No contract stores private keys or seeds
- All inter-contract calls use fully qualified principal references
- Duplicate co-signers are rejected at registration time
