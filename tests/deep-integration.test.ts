import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const wallet4 = accounts.get("wallet_4")!;
const wallet5 = accounts.get("wallet_5")!;
const wallet6 = accounts.get("wallet_6")!;
const wallet7 = accounts.get("wallet_7")!;
const wallet8 = accounts.get("wallet_8")!;
const wallet9 = accounts.get("faucet")!; // use faucet as 9th wallet for testing

const vaultCorePrincipal = `${deployer}.deadman-vault-core-v2`;

function setupAuthorizedCallers() {
  simnet.callPublicFn("deadman-delegation-registry-v2", "set-authorized-caller", [Cl.principal(vaultCorePrincipal)], deployer);
  simnet.callPublicFn("deadman-fee-vault", "set-authorized-caller", [Cl.principal(vaultCorePrincipal)], deployer);
  simnet.callPublicFn("deadman-vault-registry", "set-authorized-caller", [Cl.principal(vaultCorePrincipal)], deployer);
  simnet.callPublicFn("deadman-fee-vault", "set-fee-rate", [Cl.uint(0)], deployer);
}

function createBlockHeightVault(owner: string, amount: number, targetBlock: number, beneficiary: string) {
  return simnet.callPublicFn(
    "deadman-vault-core-v2", "create-vault",
    [Cl.uint(amount), Cl.uint(1), Cl.uint(targetBlock), Cl.uint(0), Cl.uint(0), Cl.principal(beneficiary)],
    owner
  );
}

function createInactivityVault(owner: string, amount: number, inactivityBlocks: number, beneficiary: string) {
  return simnet.callPublicFn(
    "deadman-vault-core-v2", "create-vault",
    [Cl.uint(amount), Cl.uint(2), Cl.uint(0), Cl.uint(inactivityBlocks), Cl.uint(0), Cl.principal(beneficiary)],
    owner
  );
}

function createThresholdVault(owner: string, amount: number, threshold: number, beneficiary: string) {
  return simnet.callPublicFn(
    "deadman-vault-core-v2", "create-vault",
    [Cl.uint(amount), Cl.uint(3), Cl.uint(0), Cl.uint(0), Cl.uint(threshold), Cl.principal(beneficiary)],
    owner
  );
}

// =============================================================================
// 1. RECOVERY: Re-request after rejection (was broken, now fixed)
// =============================================================================

describe("recovery: re-request after rejection", () => {
  beforeEach(() => setupAuthorizedCallers());

  it("allows new recovery request after previous one was rejected", () => {
    createBlockHeightVault(wallet1, 1000000, simnet.blockHeight + 200, wallet2);

    // Submit first recovery request
    const r1 = simnet.callPublicFn(
      "deadman-recovery", "request-recovery",
      [Cl.uint(1), Cl.stringAscii("network failure")],
      wallet1
    );
    expect(r1.result).toBeOk(Cl.uint(1));

    // Reject it
    const reject = simnet.callPublicFn(
      "deadman-recovery", "resolve-recovery",
      [Cl.uint(1), Cl.uint(2)],
      deployer
    );
    expect(reject.result).toBeOk(Cl.bool(true));

    // Verify vault-recovery mapping is cleaned up
    const mapping = simnet.callReadOnlyFn(
      "deadman-recovery", "get-vault-recovery", [Cl.uint(1)], deployer
    );
    expect(mapping.result).toBeNone();

    // Submit a NEW recovery request for the same vault
    const r2 = simnet.callPublicFn(
      "deadman-recovery", "request-recovery",
      [Cl.uint(1), Cl.stringAscii("retry after network fix")],
      wallet1
    );
    expect(r2.result).toBeOk(Cl.uint(2));
  });

  it("allows new recovery request after previous one was approved", () => {
    createBlockHeightVault(wallet1, 1000000, simnet.blockHeight + 200, wallet2);

    simnet.callPublicFn("deadman-recovery", "request-recovery", [Cl.uint(1), Cl.stringAscii("first")], wallet1);
    simnet.callPublicFn("deadman-recovery", "resolve-recovery", [Cl.uint(1), Cl.uint(1)], deployer);

    const r2 = simnet.callPublicFn(
      "deadman-recovery", "request-recovery",
      [Cl.uint(1), Cl.stringAscii("second issue")],
      wallet1
    );
    expect(r2.result).toBeOk(Cl.uint(2));
  });

  it("still blocks duplicate recovery while pending", () => {
    createBlockHeightVault(wallet1, 1000000, simnet.blockHeight + 200, wallet2);

    simnet.callPublicFn("deadman-recovery", "request-recovery", [Cl.uint(1), Cl.stringAscii("pending")], wallet1);

    const dup = simnet.callPublicFn(
      "deadman-recovery", "request-recovery",
      [Cl.uint(1), Cl.stringAscii("duplicate")],
      wallet1
    );
    expect(dup.result).toBeErr(Cl.uint(1402));
  });

  it("rejects invalid resolution values", () => {
    createBlockHeightVault(wallet1, 1000000, simnet.blockHeight + 200, wallet2);
    simnet.callPublicFn("deadman-recovery", "request-recovery", [Cl.uint(1), Cl.stringAscii("issue")], wallet1);

    const r3 = simnet.callPublicFn("deadman-recovery", "resolve-recovery", [Cl.uint(1), Cl.uint(3)], deployer);
    expect(r3.result).toBeErr(Cl.uint(1405));

    const r0 = simnet.callPublicFn("deadman-recovery", "resolve-recovery", [Cl.uint(1), Cl.uint(0)], deployer);
    expect(r0.result).toBeErr(Cl.uint(1405));
  });
});

// =============================================================================
// 2. DELEGATION REGISTRY: Cosigner slots 5-9 (was broken, now fixed)
// =============================================================================

describe("delegation-registry-v2: extended cosigner slots", () => {
  it("recognizes cosigner at index 5 (6th slot)", () => {
    // Set max cosigners to 10
    simnet.callPublicFn("admin-config", "set-max-cosigners", [Cl.uint(10)], deployer);

    const wallets = [wallet1, wallet2, wallet3, wallet4, wallet5, wallet6];
    const owner = deployer;

    // Add 6 cosigners (indices 0-5)
    for (const w of wallets) {
      simnet.callPublicFn(
        "deadman-delegation-registry-v2", "add-cosigner",
        [Cl.uint(1), Cl.principal(w), Cl.principal(owner), Cl.uint(10)],
        deployer
      );
    }

    // Cosigner at index 5 (wallet6) should be recognized
    const result = simnet.callReadOnlyFn(
      "deadman-delegation-registry-v2", "is-cosigner",
      [Cl.uint(1), Cl.principal(wallet6)],
      deployer
    );
    expect(result.result).toBeBool(true);

    // Count should be 6
    const count = simnet.callReadOnlyFn(
      "deadman-delegation-registry-v2", "get-cosigner-count",
      [Cl.uint(1)],
      deployer
    );
    expect(count.result).toBeUint(6);
  });

  it("cosigner at index 5+ can submit approval", () => {
    simnet.callPublicFn("admin-config", "set-max-cosigners", [Cl.uint(10)], deployer);
    const wallets = [wallet1, wallet2, wallet3, wallet4, wallet5, wallet6];

    for (const w of wallets) {
      simnet.callPublicFn(
        "deadman-delegation-registry-v2", "add-cosigner",
        [Cl.uint(1), Cl.principal(w), Cl.principal(deployer), Cl.uint(10)],
        deployer
      );
    }

    // wallet6 (index 5) submits approval
    const result = simnet.callPublicFn(
      "deadman-delegation-registry-v2", "submit-approval",
      [Cl.uint(1)],
      wallet6
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("handles all 10 cosigner slots (indices 0-9)", () => {
    simnet.callPublicFn("admin-config", "set-max-cosigners", [Cl.uint(10)], deployer);
    const allWallets = [wallet1, wallet2, wallet3, wallet4, wallet5, wallet6, wallet7, wallet8, wallet9];

    // Can only add 9 different wallets since deployer = owner is excluded from cosigning
    for (const w of allWallets) {
      const r = simnet.callPublicFn(
        "deadman-delegation-registry-v2", "add-cosigner",
        [Cl.uint(1), Cl.principal(w), Cl.principal(deployer), Cl.uint(10)],
        deployer
      );
      expect(r.result).toBeOk(Cl.bool(true));
    }

    // Verify last cosigner (wallet9, index 8) is recognized
    const last = simnet.callReadOnlyFn(
      "deadman-delegation-registry-v2", "is-cosigner",
      [Cl.uint(1), Cl.principal(wallet9)],
      deployer
    );
    expect(last.result).toBeBool(true);

    // Verify count
    const count = simnet.callReadOnlyFn(
      "deadman-delegation-registry-v2", "get-cosigner-count",
      [Cl.uint(1)],
      deployer
    );
    expect(count.result).toBeUint(9);
  });
});

// =============================================================================
// 3. EMERGENCY STOP: Threshold validation & resolve after cooldown
// =============================================================================

describe("emergency-stop: threshold and cooldown", () => {
  it("rejects setting vote threshold to 0", () => {
    const result = simnet.callPublicFn(
      "deadman-emergency-stop", "set-vote-threshold",
      [Cl.uint(0)],
      deployer
    );
    expect(result.result).toBeErr(Cl.uint(1300));
  });

  it("allows threshold of 1", () => {
    const result = simnet.callPublicFn(
      "deadman-emergency-stop", "set-vote-threshold",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("resolves emergency after cooldown period", () => {
    // Setup: add guardian, set threshold to 1, set short cooldown
    simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet1)], deployer);
    simnet.callPublicFn("deadman-emergency-stop", "set-vote-threshold", [Cl.uint(1)], deployer);
    simnet.callPublicFn("deadman-emergency-stop", "set-cooldown", [Cl.uint(10)], deployer);

    // Trigger emergency
    simnet.callPublicFn("deadman-emergency-stop", "vote-emergency-stop", [], wallet1);

    // Verify we're in emergency
    const before = simnet.callReadOnlyFn("deadman-emergency-stop", "is-emergency", [], deployer);
    expect(before.result).toBeBool(true);

    // Try resolve too early - should fail
    const earlyResolve = simnet.callPublicFn("deadman-emergency-stop", "resolve-emergency", [], deployer);
    expect(earlyResolve.result).toBeErr(Cl.uint(1305));

    // Mine past cooldown
    simnet.mineEmptyBlocks(11);

    // Now resolve should succeed
    const resolve = simnet.callPublicFn("deadman-emergency-stop", "resolve-emergency", [], deployer);
    expect(resolve.result).toBeOk(Cl.bool(true));

    // Emergency should be deactivated
    const after = simnet.callReadOnlyFn("deadman-emergency-stop", "is-emergency", [], deployer);
    expect(after.result).toBeBool(false);
  });

  it("vote rounds reset after resolve — guardian can vote in new round", () => {
    simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet1)], deployer);
    simnet.callPublicFn("deadman-emergency-stop", "set-vote-threshold", [Cl.uint(1)], deployer);
    simnet.callPublicFn("deadman-emergency-stop", "set-cooldown", [Cl.uint(5)], deployer);

    // Round 1: vote and trigger emergency
    simnet.callPublicFn("deadman-emergency-stop", "vote-emergency-stop", [], wallet1);
    simnet.mineEmptyBlocks(6);
    simnet.callPublicFn("deadman-emergency-stop", "resolve-emergency", [], deployer);

    // Round 2: same guardian can vote again (new round)
    const vote2 = simnet.callPublicFn("deadman-emergency-stop", "vote-emergency-stop", [], wallet1);
    expect(vote2.result).toBeOk(Cl.bool(true)); // threshold met again
  });

  it("removed guardian cannot vote", () => {
    simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet1)], deployer);
    simnet.callPublicFn("deadman-emergency-stop", "remove-guardian", [Cl.principal(wallet1)], deployer);

    const result = simnet.callPublicFn("deadman-emergency-stop", "vote-emergency-stop", [], wallet1);
    expect(result.result).toBeErr(Cl.uint(1301));
  });
});

// =============================================================================
// 4. FULL END-TO-END VAULT LIFECYCLE
// =============================================================================

describe("end-to-end: block-height vault lifecycle", () => {
  beforeEach(() => setupAuthorizedCallers());

  it("create → wait → release → beneficiary receives STX", () => {
    const amount = 5000000;
    const targetBlock = simnet.blockHeight + 150;

    const beneficiaryBefore = simnet.getAssetsMap().get("STX")?.get(wallet2) ?? BigInt(0);

    // Create vault
    const create = createBlockHeightVault(wallet1, amount, targetBlock, wallet2);
    expect(create.result).toBeOk(Cl.uint(1));

    // Verify vault registered in global registry
    const entry = simnet.callReadOnlyFn("deadman-vault-registry", "get-vault-entry", [Cl.uint(1)], deployer);
    const entryData = (entry.result as any).value.value;
    expect(entryData.status).toStrictEqual(Cl.uint(0));

    // Verify beneficiary set in delegation registry
    const ben = simnet.callReadOnlyFn("deadman-delegation-registry-v2", "get-beneficiary", [Cl.uint(1)], deployer);
    expect(ben.result).toBeSome(Cl.principal(wallet2));

    // Mine blocks to target
    simnet.mineEmptyBlocks(targetBlock - simnet.blockHeight + 1);

    // Release
    const release = simnet.callPublicFn("deadman-vault-core-v2", "trigger-release", [Cl.uint(1)], wallet1);
    expect(release.result).toBeOk(Cl.bool(true));

    // Beneficiary received funds
    const beneficiaryAfter = simnet.getAssetsMap().get("STX")?.get(wallet2) ?? BigInt(0);
    expect(beneficiaryAfter - beneficiaryBefore).toBe(BigInt(amount));

    // Vault status is released
    const status = simnet.callReadOnlyFn("deadman-vault-core-v2", "get-vault-status", [Cl.uint(1)], deployer);
    expect(status.result).toBeSome(Cl.uint(1));

    // Registry status is updated
    const regEntry = simnet.callReadOnlyFn("deadman-vault-registry", "get-vault-entry", [Cl.uint(1)], deployer);
    const regData = (regEntry.result as any).value.value;
    expect(regData.status).toStrictEqual(Cl.uint(1));
  });
});

describe("end-to-end: threshold vault lifecycle", () => {
  beforeEach(() => setupAuthorizedCallers());

  it("create → add cosigners → approve → release", () => {
    const amount = 3000000;

    // Create threshold vault requiring 2 approvals
    const create = createThresholdVault(wallet1, amount, 2, wallet2);
    expect(create.result).toBeOk(Cl.uint(1));

    // Add 3 cosigners
    simnet.callPublicFn("deadman-vault-core-v2", "add-cosigner", [Cl.uint(1), Cl.principal(wallet3)], wallet1);
    simnet.callPublicFn("deadman-vault-core-v2", "add-cosigner", [Cl.uint(1), Cl.principal(wallet4)], wallet1);
    simnet.callPublicFn("deadman-vault-core-v2", "add-cosigner", [Cl.uint(1), Cl.principal(wallet5)], wallet1);

    // Release should fail with only 1 approval
    simnet.callPublicFn("deadman-vault-core-v2", "submit-approval", [Cl.uint(1)], wallet3);
    const early = simnet.callPublicFn("deadman-vault-core-v2", "trigger-release", [Cl.uint(1)], wallet1);
    expect(early.result).toBeErr(Cl.uint(606));

    // Second approval meets threshold
    simnet.callPublicFn("deadman-vault-core-v2", "submit-approval", [Cl.uint(1)], wallet4);

    const release = simnet.callPublicFn("deadman-vault-core-v2", "trigger-release", [Cl.uint(1)], wallet1);
    expect(release.result).toBeOk(Cl.bool(true));
  });
});

describe("end-to-end: inactivity vault lifecycle", () => {
  beforeEach(() => setupAuthorizedCallers());

  it("create → go inactive → release", () => {
    const amount = 2000000;
    const inactivityBlocks = 150;

    const create = createInactivityVault(wallet1, amount, inactivityBlocks, wallet2);
    expect(create.result).toBeOk(Cl.uint(1));

    // Owner was auto-pinged at creation. Wait for inactivity period.
    simnet.mineEmptyBlocks(inactivityBlocks + 1);

    // Anyone can trigger release once conditions are met
    const release = simnet.callPublicFn("deadman-vault-core-v2", "trigger-release", [Cl.uint(1)], wallet3);
    expect(release.result).toBeOk(Cl.bool(true));
  });

  it("owner ping resets inactivity timer and prevents release", () => {
    const amount = 2000000;
    const inactivityBlocks = 150;

    createInactivityVault(wallet1, amount, inactivityBlocks, wallet2);

    // Wait part of the inactivity period
    simnet.mineEmptyBlocks(100);

    // Owner pings (proves they're alive)
    simnet.callPublicFn("activity-tracker", "ping", [], wallet1);

    // Wait another 100 blocks (but only 100 since ping, not 150)
    simnet.mineEmptyBlocks(100);

    // Release should fail — owner pinged recently
    const release = simnet.callPublicFn("deadman-vault-core-v2", "trigger-release", [Cl.uint(1)], wallet3);
    expect(release.result).toBeErr(Cl.uint(606));
  });
});

describe("end-to-end: vault cancellation and refund", () => {
  beforeEach(() => setupAuthorizedCallers());

  it("create → cancel → owner gets full refund", () => {
    const amount = 4000000;
    const ownerBefore = simnet.getAssetsMap().get("STX")?.get(wallet1) ?? BigInt(0);

    createBlockHeightVault(wallet1, amount, simnet.blockHeight + 200, wallet2);

    const ownerDuring = simnet.getAssetsMap().get("STX")?.get(wallet1) ?? BigInt(0);
    expect(ownerDuring).toBe(ownerBefore - BigInt(amount));

    simnet.callPublicFn("deadman-vault-core-v2", "cancel-vault", [Cl.uint(1)], wallet1);

    const ownerAfter = simnet.getAssetsMap().get("STX")?.get(wallet1) ?? BigInt(0);
    expect(ownerAfter).toBe(ownerBefore);
  });

  it("cannot release after cancellation", () => {
    createBlockHeightVault(wallet1, 1000000, simnet.blockHeight + 200, wallet2);
    simnet.callPublicFn("deadman-vault-core-v2", "cancel-vault", [Cl.uint(1)], wallet1);

    const release = simnet.callPublicFn("deadman-vault-core-v2", "trigger-release", [Cl.uint(1)], wallet1);
    expect(release.result).toBeErr(Cl.uint(605));
  });

  it("cannot cancel after release", () => {
    createThresholdVault(wallet1, 1000000, 1, wallet2);
    simnet.callPublicFn("deadman-vault-core-v2", "add-cosigner", [Cl.uint(1), Cl.principal(wallet3)], wallet1);
    simnet.callPublicFn("deadman-vault-core-v2", "submit-approval", [Cl.uint(1)], wallet3);
    simnet.callPublicFn("deadman-vault-core-v2", "trigger-release", [Cl.uint(1)], wallet1);

    const cancel = simnet.callPublicFn("deadman-vault-core-v2", "cancel-vault", [Cl.uint(1)], wallet1);
    expect(cancel.result).toBeErr(Cl.uint(605));
  });
});

// =============================================================================
// 5. FEE VAULT: Full fee collection and withdrawal lifecycle
// =============================================================================

describe("fee vault: collection and withdrawal lifecycle", () => {
  beforeEach(() => setupAuthorizedCallers());

  it("collects fee proportional to vault amount", () => {
    // Set fee to 100 bps (1%) — beforeEach sets it to 0, so we must reset
    simnet.callPublicFn("deadman-fee-vault", "set-fee-rate", [Cl.uint(100)], deployer);

    const amount = 10000000;
    createBlockHeightVault(wallet1, amount, simnet.blockHeight + 200, wallet2);

    // Fee = 10000000 * 100 / 10000 = 100000
    const total = simnet.callReadOnlyFn("deadman-fee-vault", "get-total-collected", [], deployer);
    expect(total.result).toBeUint(100000);
  });

  it("fee calculation matches expected formula", () => {
    // Reset fee rate since beforeEach sets it to 0
    simnet.callPublicFn("deadman-fee-vault", "set-fee-rate", [Cl.uint(50)], deployer);
    const calc = simnet.callReadOnlyFn(
      "deadman-fee-vault", "calculate-fee",
      [Cl.uint(5000000)],
      deployer
    );
    // 50 bps: 5000000 * 50 / 10000 = 25000
    expect(calc.result).toBeUint(25000);
  });

  it("max fee rate boundary (1000 bps = 10%)", () => {
    const ok = simnet.callPublicFn("deadman-fee-vault", "set-fee-rate", [Cl.uint(1000)], deployer);
    expect(ok.result).toBeOk(Cl.bool(true));

    const tooHigh = simnet.callPublicFn("deadman-fee-vault", "set-fee-rate", [Cl.uint(1001)], deployer);
    expect(tooHigh.result).toBeErr(Cl.uint(701));
  });
});

// =============================================================================
// 6. VAULT REGISTRY: Status count tracking across operations
// =============================================================================

describe("vault-registry: status count integrity", () => {
  beforeEach(() => setupAuthorizedCallers());

  it("status counts stay consistent through create, release, and cancel", () => {
    // Create 3 vaults
    createBlockHeightVault(wallet1, 1000000, simnet.blockHeight + 200, wallet2);
    createThresholdVault(wallet1, 1000000, 1, wallet3);
    createBlockHeightVault(wallet1, 1000000, simnet.blockHeight + 200, wallet4);

    // All 3 should be active
    const active3 = simnet.callReadOnlyFn("deadman-vault-registry", "get-status-count", [Cl.uint(0)], deployer);
    expect(active3.result).toBeUint(3);

    // Release vault 2
    simnet.callPublicFn("deadman-vault-core-v2", "add-cosigner", [Cl.uint(2), Cl.principal(wallet5)], wallet1);
    simnet.callPublicFn("deadman-vault-core-v2", "submit-approval", [Cl.uint(2)], wallet5);
    simnet.callPublicFn("deadman-vault-core-v2", "trigger-release", [Cl.uint(2)], wallet1);

    // Cancel vault 3
    simnet.callPublicFn("deadman-vault-core-v2", "cancel-vault", [Cl.uint(3)], wallet1);

    // Check final counts
    const active = simnet.callReadOnlyFn("deadman-vault-registry", "get-status-count", [Cl.uint(0)], deployer);
    expect(active.result).toBeUint(1); // vault 1 still active

    const released = simnet.callReadOnlyFn("deadman-vault-registry", "get-status-count", [Cl.uint(1)], deployer);
    expect(released.result).toBeUint(1); // vault 2 released

    const cancelled = simnet.callReadOnlyFn("deadman-vault-registry", "get-status-count", [Cl.uint(2)], deployer);
    expect(cancelled.result).toBeUint(1); // vault 3 cancelled
  });
});

// =============================================================================
// 7. ACCESS CONTROL: Role management
// =============================================================================

describe("access-control: role management", () => {
  it("deployer has all roles implicitly", () => {
    const admin = simnet.callReadOnlyFn("deadman-access-control", "has-role", [Cl.principal(deployer), Cl.uint(0)], deployer);
    expect(admin.result).toBeBool(true);

    const operator = simnet.callReadOnlyFn("deadman-access-control", "has-role", [Cl.principal(deployer), Cl.uint(1)], deployer);
    expect(operator.result).toBeBool(true);

    const guardian = simnet.callReadOnlyFn("deadman-access-control", "has-role", [Cl.principal(deployer), Cl.uint(2)], deployer);
    expect(guardian.result).toBeBool(true);
  });

  it("grant and revoke role for non-deployer", () => {
    // Grant operator role
    const grant = simnet.callPublicFn(
      "deadman-access-control", "grant-role",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(grant.result).toBeOk(Cl.bool(true));

    const has = simnet.callReadOnlyFn("deadman-access-control", "has-role", [Cl.principal(wallet1), Cl.uint(1)], deployer);
    expect(has.result).toBeBool(true);

    // Revoke it
    const revoke = simnet.callPublicFn(
      "deadman-access-control", "revoke-role",
      [Cl.principal(wallet1), Cl.uint(1)],
      deployer
    );
    expect(revoke.result).toBeOk(Cl.bool(true));

    const hasAfter = simnet.callReadOnlyFn("deadman-access-control", "has-role", [Cl.principal(wallet1), Cl.uint(1)], deployer);
    expect(hasAfter.result).toBeBool(false);
  });

  it("non-deployer cannot grant roles", () => {
    const result = simnet.callPublicFn(
      "deadman-access-control", "grant-role",
      [Cl.principal(wallet2), Cl.uint(0)],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(1200));
  });
});

// =============================================================================
// 8. VAULT EXTENSIONS: Metadata storage
// =============================================================================

describe("vault-extensions: metadata edge cases", () => {
  beforeEach(() => setupAuthorizedCallers());

  it("only vault owner can set metadata", () => {
    createBlockHeightVault(wallet1, 1000000, simnet.blockHeight + 200, wallet2);

    // Non-owner should fail
    const fail = simnet.callPublicFn(
      "deadman-vault-extensions", "set-vault-metadata",
      [Cl.uint(1), Cl.stringAscii("Stolen Vault"), Cl.uint(0)],
      wallet2
    );
    expect(fail.result).toBeErr(Cl.uint(1001));

    // Owner should succeed
    const ok = simnet.callPublicFn(
      "deadman-vault-extensions", "set-vault-metadata",
      [Cl.uint(1), Cl.stringAscii("My Vault"), Cl.uint(1)],
      wallet1
    );
    expect(ok.result).toBeOk(Cl.bool(true));
  });

  it("metadata persists after vault status change", () => {
    createBlockHeightVault(wallet1, 1000000, simnet.blockHeight + 200, wallet2);
    simnet.callPublicFn("deadman-vault-extensions", "set-vault-metadata", [Cl.uint(1), Cl.stringAscii("Legacy Vault"), Cl.uint(5)], wallet1);

    // Cancel the vault
    simnet.callPublicFn("deadman-vault-core-v2", "cancel-vault", [Cl.uint(1)], wallet1);

    // Metadata should still be readable
    const name = simnet.callReadOnlyFn("deadman-vault-extensions", "get-vault-name", [Cl.uint(1)], deployer);
    expect(name.result).toBeSome(Cl.stringAscii("Legacy Vault"));
  });
});

// =============================================================================
// 9. TIME UTILS: Pure utility functions
// =============================================================================

describe("time-utils: utility calculations", () => {
  it("blocks-to-hours converts correctly", () => {
    // ~10 min/block: 144 * 10 / 60 = 24 hours
    const result = simnet.callReadOnlyFn("deadman-time-utils", "blocks-to-hours", [Cl.uint(144)], deployer);
    expect(result.result).toBeUint(24);
  });

  it("blocks-to-days converts correctly", () => {
    const result = simnet.callReadOnlyFn("deadman-time-utils", "blocks-to-days", [Cl.uint(144)], deployer);
    // 144 / 144 = 1 day
    expect(result.result).toBeUint(1);
  });

  it("blocks-remaining returns 0 for past target", () => {
    const pastBlock = 1;
    const result = simnet.callReadOnlyFn(
      "deadman-time-utils", "blocks-remaining",
      [Cl.uint(pastBlock)],
      deployer
    );
    expect(result.result).toBeUint(0);
  });

  it("blocks-remaining returns positive for future target", () => {
    const futureBlock = simnet.blockHeight + 100;
    const result = simnet.callReadOnlyFn(
      "deadman-time-utils", "blocks-remaining",
      [Cl.uint(futureBlock)],
      deployer
    );
    const val = Number((result.result as any).value);
    expect(val).toBeGreaterThan(0);
  });

  it("is-past-target returns true for passed blocks", () => {
    const result = simnet.callReadOnlyFn(
      "deadman-time-utils", "is-past-target",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });

  it("days-to-blocks converts correctly", () => {
    const result = simnet.callReadOnlyFn("deadman-time-utils", "days-to-blocks", [Cl.uint(7)], deployer);
    // 7 * 144 = 1008
    expect(result.result).toBeUint(1008);
  });
});

// =============================================================================
// 10. ADMIN CONFIG: Boundary validation
// =============================================================================

describe("admin-config: boundary validation", () => {
  it("min-lock-blocks rejects 0", () => {
    const result = simnet.callPublicFn("admin-config", "set-min-lock-blocks", [Cl.uint(0)], deployer);
    expect(result.result).toBeErr(Cl.uint(101));
  });

  it("max-cosigners rejects 0 and 11", () => {
    const r0 = simnet.callPublicFn("admin-config", "set-max-cosigners", [Cl.uint(0)], deployer);
    expect(r0.result).toBeErr(Cl.uint(101));

    const r11 = simnet.callPublicFn("admin-config", "set-max-cosigners", [Cl.uint(11)], deployer);
    expect(r11.result).toBeErr(Cl.uint(101));
  });

  it("max-cosigners accepts 1 and 10", () => {
    const r1 = simnet.callPublicFn("admin-config", "set-max-cosigners", [Cl.uint(1)], deployer);
    expect(r1.result).toBeOk(Cl.bool(true));

    const r10 = simnet.callPublicFn("admin-config", "set-max-cosigners", [Cl.uint(10)], deployer);
    expect(r10.result).toBeOk(Cl.bool(true));
  });

  it("max-beneficiaries rejects 0 and 11", () => {
    const r0 = simnet.callPublicFn("admin-config", "set-max-beneficiaries", [Cl.uint(0)], deployer);
    expect(r0.result).toBeErr(Cl.uint(101));

    const r11 = simnet.callPublicFn("admin-config", "set-max-beneficiaries", [Cl.uint(11)], deployer);
    expect(r11.result).toBeErr(Cl.uint(101));
  });

  it("get-config returns bundled config", () => {
    const result = simnet.callReadOnlyFn("admin-config", "get-config", [], deployer);
    const cfg = (result.result as any).value;
    expect(cfg["min-lock-blocks"]).toStrictEqual(Cl.uint(144));
    expect(cfg.paused).toStrictEqual(Cl.bool(false));
  });

  it("non-deployer cannot change config", () => {
    const r1 = simnet.callPublicFn("admin-config", "set-min-lock-blocks", [Cl.uint(200)], wallet1);
    expect(r1.result).toBeErr(Cl.uint(100));

    const r2 = simnet.callPublicFn("admin-config", "set-paused", [Cl.bool(true)], wallet1);
    expect(r2.result).toBeErr(Cl.uint(100));
  });
});

// =============================================================================
// 11. NOTIFICATION LOGGER: Event logging
// =============================================================================

describe("notification-logger: event recording", () => {
  it("deployer can log events", () => {
    const result = simnet.callPublicFn(
      "deadman-notification-logger", "log-event",
      [Cl.stringAscii("vault-created"), Cl.uint(1), Cl.principal(deployer), Cl.uint(1000000)],
      deployer
    );
    expect(result.result).toBeOk(Cl.uint(1));
  });

  it("logged events are retrievable", () => {
    simnet.callPublicFn(
      "deadman-notification-logger", "log-event",
      [Cl.stringAscii("vault-released"), Cl.uint(5), Cl.principal(wallet1), Cl.uint(500000)],
      deployer
    );

    const event = simnet.callReadOnlyFn(
      "deadman-notification-logger", "get-event", [Cl.uint(1)], deployer
    );
    const data = (event.result as any).value.value;
    expect(data["event-type"]).toStrictEqual(Cl.stringAscii("vault-released"));
    expect(data["vault-id"]).toStrictEqual(Cl.uint(5));
  });

  it("unauthorized callers cannot log events", () => {
    const result = simnet.callPublicFn(
      "deadman-notification-logger", "log-event",
      [Cl.stringAscii("hack"), Cl.uint(1), Cl.principal(wallet1), Cl.uint(0)],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(900));
  });
});

// =============================================================================
// 12. CONDITION ENGINE: Edge cases
// =============================================================================

describe("condition-engine: evaluation edge cases", () => {
  it("block-height condition fails before target", () => {
    const futureBlock = simnet.blockHeight + 1000;
    const result = simnet.callReadOnlyFn(
      "condition-engine", "evaluate-condition",
      [Cl.uint(1), Cl.principal(wallet1), Cl.uint(futureBlock), Cl.uint(0), Cl.uint(0), Cl.uint(0)],
      deployer
    );
    expect(result.result).toBeOk(Cl.bool(false));
  });

  it("block-height condition passes at target", () => {
    const pastBlock = simnet.blockHeight - 1;
    const result = simnet.callReadOnlyFn(
      "condition-engine", "evaluate-condition",
      [Cl.uint(1), Cl.principal(wallet1), Cl.uint(pastBlock), Cl.uint(0), Cl.uint(0), Cl.uint(0)],
      deployer
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("threshold condition passes when approvals >= required", () => {
    const result = simnet.callReadOnlyFn(
      "condition-engine", "evaluate-condition",
      [Cl.uint(3), Cl.principal(wallet1), Cl.uint(0), Cl.uint(0), Cl.uint(3), Cl.uint(2)],
      deployer
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("threshold condition fails when approvals < required", () => {
    const result = simnet.callReadOnlyFn(
      "condition-engine", "evaluate-condition",
      [Cl.uint(3), Cl.principal(wallet1), Cl.uint(0), Cl.uint(0), Cl.uint(1), Cl.uint(3)],
      deployer
    );
    expect(result.result).toBeOk(Cl.bool(false));
  });

  it("rejects invalid condition type", () => {
    const result = simnet.callReadOnlyFn(
      "condition-engine", "evaluate-condition",
      [Cl.uint(4), Cl.principal(wallet1), Cl.uint(0), Cl.uint(0), Cl.uint(0), Cl.uint(0)],
      deployer
    );
    expect(result.result).toBeErr(Cl.uint(400));
  });
});

// =============================================================================
// 13. ACTIVITY TRACKER: ping and inactivity
// =============================================================================

describe("activity-tracker: detailed behavior", () => {
  it("get-last-active returns none before first ping", () => {
    const result = simnet.callReadOnlyFn(
      "activity-tracker", "get-last-active",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result.result).toBeNone();
  });

  it("ping sets last-active to current block", () => {
    simnet.callPublicFn("activity-tracker", "ping", [], wallet1);
    const result = simnet.callReadOnlyFn(
      "activity-tracker", "get-last-active",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result.result).not.toBeNone();
  });

  it("is-inactive returns true for never-pinged principal after enough blocks", () => {
    // is-inactive defaults last-seen to u0, so needs block-height >= threshold
    simnet.mineEmptyBlocks(101);
    const result = simnet.callReadOnlyFn(
      "activity-tracker", "is-inactive",
      [Cl.principal(wallet1), Cl.uint(100)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });

  it("is-inactive returns false right after ping", () => {
    simnet.callPublicFn("activity-tracker", "ping", [], wallet1);
    const result = simnet.callReadOnlyFn(
      "activity-tracker", "is-inactive",
      [Cl.principal(wallet1), Cl.uint(100)],
      deployer
    );
    expect(result.result).toBeBool(false);
  });

  it("is-inactive returns true after enough blocks pass", () => {
    simnet.callPublicFn("activity-tracker", "ping", [], wallet1);
    simnet.mineEmptyBlocks(200);

    const result = simnet.callReadOnlyFn(
      "activity-tracker", "is-inactive",
      [Cl.principal(wallet1), Cl.uint(100)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });
});

// =============================================================================
// 14. RELEASE HANDLER V2: Standalone utility
// =============================================================================

describe("release-handler-v2: authorization", () => {
  it("only deployer can set authorized caller", () => {
    const ok = simnet.callPublicFn(
      "deadman-release-handler-v2", "set-authorized-caller",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(ok.result).toBeOk(Cl.bool(true));

    const fail = simnet.callPublicFn(
      "deadman-release-handler-v2", "set-authorized-caller",
      [Cl.principal(wallet2)],
      wallet1
    );
    expect(fail.result).toBeErr(Cl.uint(500));
  });
});

// =============================================================================
// 15. MULTIPLE VAULTS: Cross-owner isolation
// =============================================================================

describe("cross-owner vault isolation", () => {
  beforeEach(() => setupAuthorizedCallers());

  it("different owners have isolated vault counts and indices", () => {
    // wallet1 creates 2 vaults
    createBlockHeightVault(wallet1, 1000000, simnet.blockHeight + 200, wallet3);
    createBlockHeightVault(wallet1, 2000000, simnet.blockHeight + 200, wallet4);

    // wallet2 creates 1 vault
    createBlockHeightVault(wallet2, 500000, simnet.blockHeight + 200, wallet5);

    const count1 = simnet.callReadOnlyFn("deadman-vault-core-v2", "get-owner-vault-count", [Cl.principal(wallet1)], deployer);
    expect(count1.result).toBeUint(2);

    const count2 = simnet.callReadOnlyFn("deadman-vault-core-v2", "get-owner-vault-count", [Cl.principal(wallet2)], deployer);
    expect(count2.result).toBeUint(1);

    // wallet1's first vault is ID 1
    const w1v0 = simnet.callReadOnlyFn("deadman-vault-core-v2", "get-owner-vault-id", [Cl.principal(wallet1), Cl.uint(0)], deployer);
    expect(w1v0.result).toBeSome(Cl.uint(1));

    // wallet2's first vault is ID 3
    const w2v0 = simnet.callReadOnlyFn("deadman-vault-core-v2", "get-owner-vault-id", [Cl.principal(wallet2), Cl.uint(0)], deployer);
    expect(w2v0.result).toBeSome(Cl.uint(3));
  });

  it("cancelling one owner's vault doesn't affect another", () => {
    createBlockHeightVault(wallet1, 1000000, simnet.blockHeight + 200, wallet3);
    createBlockHeightVault(wallet2, 1000000, simnet.blockHeight + 200, wallet4);

    simnet.callPublicFn("deadman-vault-core-v2", "cancel-vault", [Cl.uint(1)], wallet1);

    // wallet2's vault should still be active
    const status = simnet.callReadOnlyFn("deadman-vault-core-v2", "get-vault-status", [Cl.uint(2)], deployer);
    expect(status.result).toBeSome(Cl.uint(0));
  });
});
