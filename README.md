# Deadman Protocol

A generalized on-chain trust delegation and conditional transfer protocol built on Stacks.

Deadman allows principals to create vaults that hold STX, and define verifiable
on-chain conditions under which those vaults release — using only block height, principal
activity, and co-signer thresholds. No oracles. No off-chain dependencies.

## Use Cases

- Dead man's switch: release assets if no activity for N blocks
- Conditional delivery: release funds on co-signer approval
- Time-locked transfer: release STX after a target block height
- Threshold release: require M-of-N approvals before release

## Smart Contracts

| Contract | Purpose |
|---|---|
| `deadman-vault-core` | Main entry point — vault creation, release, cancellation |
| `condition-engine` | Evaluates block-height, inactivity, and threshold conditions |
| `delegation-registry` | Stores beneficiary and co-signer designations |
| `activity-tracker` | Records last-active block for inactivity checks |
| `release-handler` | Standalone release utility (retained for extensions) |
| `admin-config` | Protocol configuration (min lock, max cosigners, pause) |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture.

## Stack

- Smart contracts: Clarity (Stacks, clarity_version 2, epoch 2.5)
- Frontend: React 19 + Vite + @stacks/connect + @stacks/transactions
- Testing: Clarinet SDK + Vitest
- Local development: Clarinet

## Development

### Contracts
```bash
# Check contracts compile
clarinet check

# Run all tests (124 tests across 6 files)
npm test

# Watch mode
npm run test:watch
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Status

Active development. Not yet deployed to mainnet.
