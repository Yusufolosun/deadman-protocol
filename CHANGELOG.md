# Changelog

All notable changes to Deadman Protocol will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Production-ready frontend with full contract integration
- Toast notification system for transaction feedback
- Comprehensive formatting utilities for STX amounts, addresses, and block times
- Skeleton loading components for improved UX
- Tooltip and Tabs reusable components
- Confirmation dialog for destructive actions
- Transaction status tracking hook
- Search and filter functionality for vault dashboard
- Copy-to-clipboard utility for addresses
- Network status indicator in navbar
- Co-signer management in vault detail view
- GitHub Actions CI/CD workflow for contracts and frontend
- Comprehensive documentation suite (CONTRIBUTING, SECURITY, API reference)
- EditorConfig and Prettier for consistent code formatting
- Frontend environment configuration guide

### Changed
- Dashboard now fetches real vault data from chain instead of mock data
- Improved error handling across all contract interactions
- Enhanced responsive design for mobile devices

### Fixed
- Vault detail page correctly loads co-signer list
- Activity page properly refreshes after ping transaction

## [0.1.0] - 2025-06-15

### Added
- Initial protocol implementation with 14 Clarity smart contracts
- Core vault creation, release, and cancellation flows
- Three condition types: block-height, inactivity, M-of-N threshold
- React 19 frontend with Stacks wallet integration
- Comprehensive test suite (124+ tests across 15 files)
- Protocol fee collection via basis points
- Emergency stop mechanism with guardian voting
- Recovery system for stuck vaults
- Role-based access control
- Event logging for off-chain indexers
- Vault metadata extensions

[Unreleased]: https://github.com/Yusufolosun/deadman-protocol/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Yusufolosun/deadman-protocol/releases/tag/v0.1.0
