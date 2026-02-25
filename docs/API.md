# Deadman Protocol — Smart Contract API Reference

This document describes the public functions available in each Deadman Protocol
smart contract. All contracts use Clarity version 2, epoch 2.5.

## Table of Contents

- [deadman-vault-core-v2](#deadman-vault-core-v2)
- [condition-engine](#condition-engine)
- [deadman-delegation-registry-v2](#deadman-delegation-registry-v2)
- [activity-tracker](#activity-tracker)
- [admin-config](#admin-config)
- [deadman-fee-vault](#deadman-fee-vault)
- [deadman-vault-registry](#deadman-vault-registry)
- [deadman-vault-extensions](#deadman-vault-extensions)
- [deadman-time-utils](#deadman-time-utils)
- [deadman-access-control](#deadman-access-control)
- [deadman-emergency-stop](#deadman-emergency-stop)
- [deadman-recovery](#deadman-recovery)

---

## deadman-vault-core-v2

The primary entry point for vault operations.

### Public Functions

#### `create-vault`
Create a new conditional vault with deposited STX.

```clarity
(define-public (create-vault
  (amount uint)
  (condition-type uint)
  (target-block uint)
  (inactivity-blocks uint)
  (required-threshold uint)
  (beneficiary principal))
  (response uint uint))
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `amount` | `uint` | STX amount to lock (in microSTX) |
| `condition-type` | `uint` | 1=Block Height, 2=Inactivity, 3=Threshold |
| `target-block` | `uint` | Target block for type 1 (0 for others) |
| `inactivity-blocks` | `uint` | Inactivity window for type 2 (0 for others) |
| `required-threshold` | `uint` | M-of-N threshold for type 3 (0 for others) |
| `beneficiary` | `principal` | Recipient address |

**Returns:** Vault ID on success.

#### `cancel-vault`
Cancel an active vault and refund STX to the owner.

```clarity
(define-public (cancel-vault (vault-id uint))
  (response bool uint))
```

Only the vault owner can cancel. Status changes to `2` (cancelled).

#### `trigger-release`
Attempt to release vault funds to the beneficiary.

```clarity
(define-public (trigger-release (vault-id uint))
  (response bool uint))
```

Anyone can call, but the condition must be met. On success, STX transfers
to the beneficiary and status changes to `1` (released).

#### `submit-approval`
Submit a co-signer approval for a threshold vault.

```clarity
(define-public (submit-approval (vault-id uint))
  (response bool uint))
```

Caller must be a registered co-signer for the vault.

#### `add-cosigner`
Add a co-signer to a vault.

```clarity
(define-public (add-cosigner (vault-id uint) (cosigner principal))
  (response bool uint))
```

Only the vault owner can add co-signers.

### Read-Only Functions

#### `get-vault`
```clarity
(define-read-only (get-vault (vault-id uint))
  (optional {
    owner: principal,
    amount: uint,
    condition-type: uint,
    target-block: uint,
    inactivity-blocks: uint,
    required-threshold: uint,
    status: uint,
    created-at: uint
  }))
```

#### `get-next-vault-id`
```clarity
(define-read-only (get-next-vault-id) uint)
```

#### `get-owner-vault-count`
```clarity
(define-read-only (get-owner-vault-count (owner principal)) uint)
```

#### `get-owner-vault-id`
```clarity
(define-read-only (get-owner-vault-id (owner principal) (index uint))
  (optional uint))
```

---

## condition-engine

Evaluates whether a vault's release conditions have been met.

### Read-Only Functions

#### `evaluate-condition`
```clarity
(define-read-only (evaluate-condition
  (condition-type uint)
  (target-block uint)
  (inactivity-blocks uint)
  (required-threshold uint)
  (vault-owner principal)
  (vault-id uint))
  (response bool uint))
```

Returns `(ok true)` if the condition is satisfied.

---

## deadman-delegation-registry-v2

Manages beneficiary and co-signer assignments per vault.

### Public Functions

#### `set-beneficiary`
```clarity
(define-public (set-beneficiary (vault-id uint) (beneficiary principal))
  (response bool uint))
```

#### `add-cosigner`
```clarity
(define-public (add-cosigner (vault-id uint) (cosigner principal))
  (response bool uint))
```

#### `submit-approval`
```clarity
(define-public (submit-approval (vault-id uint) (cosigner principal))
  (response bool uint))
```

### Read-Only Functions

#### `get-beneficiary`
```clarity
(define-read-only (get-beneficiary (vault-id uint))
  (optional principal))
```

#### `get-cosigner-count`
```clarity
(define-read-only (get-cosigner-count (vault-id uint)) uint)
```

#### `get-cosigner`
```clarity
(define-read-only (get-cosigner (vault-id uint) (index uint))
  (optional principal))
```

#### `get-approval-count`
```clarity
(define-read-only (get-approval-count (vault-id uint)) uint)
```

#### `has-approved`
```clarity
(define-read-only (has-approved (vault-id uint) (cosigner principal)) bool)
```

---

## activity-tracker

Records liveness pings for inactivity-based conditions.

### Public Functions

#### `ping`
```clarity
(define-public (ping) (response bool uint))
```

Records the current block height as the caller's last active block.

### Read-Only Functions

#### `get-last-active`
```clarity
(define-read-only (get-last-active (who principal)) (optional uint))
```

---

## admin-config

Protocol-wide configuration managed by the deployer.

### Public Functions

#### `set-min-lock-blocks`
```clarity
(define-public (set-min-lock-blocks (value uint))
  (response bool uint))
```

#### `set-max-cosigners`
```clarity
(define-public (set-max-cosigners (value uint))
  (response bool uint))
```

#### `set-protocol-paused`
```clarity
(define-public (set-protocol-paused (paused bool))
  (response bool uint))
```

### Read-Only Functions

#### `get-config`
```clarity
(define-read-only (get-config)
  {
    min-lock-blocks: uint,
    max-cosigners: uint,
    max-beneficiaries: uint,
    protocol-paused: bool
  })
```

---

## deadman-fee-vault

Protocol fee collection on vault creation.

### Public Functions

#### `collect-fee`
```clarity
(define-public (collect-fee (amount uint) (payer principal))
  (response uint uint))
```

Returns the fee amount collected.

#### `withdraw-fees`
```clarity
(define-public (withdraw-fees) (response uint uint))
```

Deployer-only. Withdraws accumulated fees.

### Read-Only Functions

#### `get-fee-rate`
```clarity
(define-read-only (get-fee-rate) uint)
```

Returns fee rate in basis points (e.g., 50 = 0.5%).

#### `get-accumulated-fees`
```clarity
(define-read-only (get-accumulated-fees) uint)
```

---

## deadman-vault-registry

Global vault index for tracking and querying.

### Read-Only Functions

#### `get-vault-count`
```clarity
(define-read-only (get-vault-count) uint)
```

#### `get-vault-count-by-status`
```clarity
(define-read-only (get-vault-count-by-status (status uint)) uint)
```

---

## deadman-time-utils

Block-time estimation utilities (read-only).

### Read-Only Functions

#### `blocks-to-minutes`
```clarity
(define-read-only (blocks-to-minutes (blocks uint)) uint)
```

#### `blocks-to-hours`
```clarity
(define-read-only (blocks-to-hours (blocks uint)) uint)
```

#### `blocks-to-days`
```clarity
(define-read-only (blocks-to-days (blocks uint)) uint)
```

---

## deadman-emergency-stop

Guardian-based emergency controls.

### Public Functions

#### `vote-emergency-stop`
```clarity
(define-public (vote-emergency-stop) (response bool uint))
```

#### `resolve-emergency`
```clarity
(define-public (resolve-emergency) (response bool uint))
```

---

## deadman-recovery

Recovery mechanisms for stuck vaults.

### Public Functions

#### `request-recovery`
```clarity
(define-public (request-recovery (vault-id uint)) (response bool uint))
```

#### `resolve-recovery`
```clarity
(define-public (resolve-recovery (vault-id uint) (approved bool))
  (response bool uint))
```
