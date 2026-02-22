# Deadman Protocol — Contract Architecture

## Overview

The protocol is composed of six Clarity smart contracts, each with a single,
well-defined responsibility. Contracts communicate through explicit inter-contract
calls. No contract holds responsibilities outside its domain.

## Contracts

### vault-core
The primary entry point. Users create and manage vaults here. Holds STX balances
and references conditions defined in condition-engine. Enforces that only the
vault owner can modify vault parameters before activation.

### condition-engine
Evaluates whether a vault's trigger conditions have been met. Supports three
condition types: block-height threshold, inactivity period (via activity-tracker),
and M-of-N co-signer approval. Returns a boolean to vault-core and release-handler.

### delegation-registry
Stores principal-to-principal delegation mappings. Tracks who has been designated
as a beneficiary, co-signer, or verifier for each vault. Enforces uniqueness and
prevents self-delegation.

### activity-tracker
Records the last-seen block height for any principal who pings it. Used by
condition-engine to evaluate inactivity-based triggers without off-chain data.

### release-handler
Executes vault release once condition-engine confirms conditions are met.
Transfers STX to the designated beneficiary. Emits a release event. This
contract cannot be called directly by users — only by vault-core.

### admin-config
Stores protocol-level configuration: minimum vault duration (in blocks),
maximum co-signer count, protocol pause flag. Controlled exclusively by
the deployer address. No upgrade proxy pattern — values are simple data vars.

## Call Flow
```
User → vault-core (create-vault)
User → activity-tracker (ping)
User/Co-signer → vault-core (approve / trigger-release)
vault-core → condition-engine (check-conditions)
vault-core → release-handler (execute-release)
release-handler → delegation-registry (get-beneficiary)
```

## Security Constraints

- release-handler is not publicly callable
- admin-config is write-restricted to deployer
- No contract stores private keys or seeds
- All inter-contract calls use fully qualified principal references
