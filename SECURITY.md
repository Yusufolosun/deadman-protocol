# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

The Deadman Protocol takes security seriously. If you discover a security
vulnerability, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities.
2. Email your findings to the maintainers with the subject line:
   `[SECURITY] Deadman Protocol Vulnerability Report`
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment** within 48 hours of your report.
- **Assessment** within 7 days with an initial severity evaluation.
- **Resolution** timeline communicated based on severity.

### Scope

The following are in scope for security reports:

- Clarity smart contracts (`contracts/*.clar`)
- Contract interaction logic (`frontend/src/lib/contracts.ts`)
- Authentication and wallet integration (`frontend/src/hooks/AuthContext.tsx`)
- Transaction signing flows

### Out of Scope

- Frontend UI/UX issues that don't involve fund security
- Denial of service attacks on the frontend
- Issues in third-party dependencies (report to upstream)

## Security Best Practices

When using Deadman Protocol:

- Never share your wallet seed phrase or private keys
- Always verify transaction details before signing
- Use hardware wallets for large amounts
- Test with small amounts on testnet first
- Review vault conditions carefully before creation

## Audit Status

The Deadman Protocol smart contracts have **not yet undergone a formal security
audit**. Use at your own risk. We plan to engage auditors before any mainnet
deployment.
