✔ 6 contracts checked# Deadman Protocol

A generalized on-chain trust delegation and conditional transfer protocol built on Stacks.

Deadman allows principals to create vaults that hold STX or data, and define verifiable
on-chain conditions under which those vaults activate — using only block height, principal
activity, and co-signer thresholds. No oracles. No off-chain dependencies.

## Use Cases

- Dead man's switch: release assets if no activity for N blocks
- Conditional delivery: release funds on co-signer approval
- Time-locked disclosure: make data retrievable after a block height
- Threshold release: require M-of-N approvals before release

## Stack

- Smart contracts: Clarity (Stacks mainnet)
- Frontend: React + @stacks/connect + @stacks/transactions
- Local development: Clarinet

## Development
```bash
clarinet check
clarinet test
```

## Status

Active development. Not yet deployed to mainnet.
