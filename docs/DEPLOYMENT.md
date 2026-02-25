# Deployment Guide

This document covers deploying the Deadman Protocol smart contracts and frontend
application.

## Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) >= 2.x
- [Node.js](https://nodejs.org/) >= 18.x
- A Stacks wallet with STX for deployment fees
- Access to a Stacks node (or use the Hiro API)

## Smart Contracts

### Testnet Deployment

1. **Configure your wallet** in `settings/Testnet.toml`:
   ```toml
   [accounts.deployer]
   mnemonic = "<your-testnet-mnemonic>"
   ```
   > **WARNING**: Never commit this file. It is gitignored by default.

2. **Review the deployment plan** in `deployments/default.testnet-plan.yaml`.

3. **Deploy contracts**:
   ```bash
   clarinet deployments apply --testnet
   ```

4. **Verify deployment** on the [Stacks Explorer](https://explorer.hiro.so/?chain=testnet).

### Mainnet Deployment

1. **Configure your wallet** in `settings/Mainnet.toml`.

2. **Review the deployment plan** in `deployments/default.mainnet-plan.yaml`.

3. **Deploy contracts**:
   ```bash
   clarinet deployments apply --mainnet
   ```

### Contract Deployment Order

Contracts must be deployed in dependency order. The Clarinet deployment plan
handles this automatically based on `Clarinet.toml`:

1. `admin-config` (no dependencies)
2. `activity-tracker` (no dependencies)
3. `condition-engine` (no dependencies)
4. `deadman-time-utils` (no dependencies)
5. `deadman-access-control` (no dependencies)
6. `deadman-fee-vault` (no dependencies)
7. `deadman-notification-logger` (no dependencies)
8. `deadman-vault-registry` (no dependencies)
9. `deadman-emergency-stop` (no dependencies)
10. `deadman-delegation-registry-v2` (no dependencies)
11. `deadman-release-handler-v2` (no dependencies)
12. `deadman-vault-core-v2` (depends on fee-vault, delegation-registry, vault-registry, activity-tracker)
13. `deadman-vault-extensions` (depends on vault-core-v2)
14. `deadman-recovery` (depends on vault-core-v2)

### Post-Deployment Verification

After deploying, verify each contract is operational:

```bash
# Check admin config
clarinet console
>> (contract-call? .admin-config get-config)
```

## Frontend

### Environment Configuration

Create a `.env` file in the `frontend/` directory:

```bash
cd frontend
cp .env.example .env
```

Update the values:

```env
# Network: testnet or mainnet
VITE_NETWORK=testnet

# Contract deployer address
VITE_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM

# Stacks API endpoint
VITE_API_URL=https://api.testnet.hiro.so
```

### Development Build

```bash
cd frontend
npm install
npm run dev
```

### Production Build

```bash
cd frontend
npm run build
npm run preview  # Test the production build locally
```

The build output is in `frontend/dist/`.

### Deployment Options

#### Static Hosting (Recommended)

The frontend is a static SPA that can be deployed to any static hosting provider:

- **Vercel**: Connect your GitHub repo for automatic deployments
- **Netlify**: Drop the `dist/` folder or connect your repo
- **GitHub Pages**: Use the `gh-pages` branch or GitHub Actions
- **Cloudflare Pages**: Connect your repo for edge deployments

#### Docker (Optional)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### SPA Routing

Since the frontend uses client-side routing (`react-router-dom`), configure
your hosting provider to redirect all routes to `index.html`:

**Netlify** (`frontend/public/_redirects`):
```
/*    /index.html   200
```

**Vercel** (`frontend/vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Security Considerations

- Never expose deployment mnemonics or private keys
- All `settings/*.toml` files are gitignored
- All `deployments/` plans are gitignored
- Use environment variables for sensitive configuration
- Enable HTTPS for all production deployments
- Consider using a hardware wallet for mainnet deployment
