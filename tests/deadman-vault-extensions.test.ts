import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

const vaultCorePrincipal = `${deployer}.deadman-vault-core-v2`;

// Set up authorized callers for vault creation
function setupAuthorizedCallers() {
  simnet.callPublicFn("deadman-delegation-registry-v2", "set-authorized-caller", [Cl.principal(vaultCorePrincipal)], deployer);
  simnet.callPublicFn("deadman-fee-vault", "set-authorized-caller", [Cl.principal(vaultCorePrincipal)], deployer);
  simnet.callPublicFn("deadman-vault-registry", "set-authorized-caller", [Cl.principal(vaultCorePrincipal)], deployer);
  simnet.callPublicFn("deadman-fee-vault", "set-fee-rate", [Cl.uint(0)], deployer);
}

// Create a vault for testing extensions
function createTestVault(owner: string, beneficiary: string) {
  return simnet.callPublicFn(
    "deadman-vault-core-v2",
    "create-vault",
    [Cl.uint(1000000), Cl.uint(1), Cl.uint(simnet.blockHeight + 200), Cl.uint(0), Cl.uint(0), Cl.principal(beneficiary)],
    owner
  );
}

describe("deadman-vault-extensions", () => {
  describe("set-vault-metadata", () => {
    it("allows vault owner to set metadata", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);

      const result = simnet.callPublicFn(
        "deadman-vault-extensions",
        "set-vault-metadata",
        [Cl.uint(1), Cl.stringAscii("My Emergency Vault"), Cl.uint(1)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-owner setting metadata", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);

      const result = simnet.callPublicFn(
        "deadman-vault-extensions",
        "set-vault-metadata",
        [Cl.uint(1), Cl.stringAscii("Hijack"), Cl.uint(0)],
        wallet2
      );
      expect(result.result).toBeErr(Cl.uint(1001));
    });

    it("rejects metadata for non-existent vault", () => {
      const result = simnet.callPublicFn(
        "deadman-vault-extensions",
        "set-vault-metadata",
        [Cl.uint(999), Cl.stringAscii("Ghost"), Cl.uint(0)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(1000));
    });

    it("allows owner to update metadata", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);
      simnet.callPublicFn(
        "deadman-vault-extensions",
        "set-vault-metadata",
        [Cl.uint(1), Cl.stringAscii("First"), Cl.uint(1)],
        wallet1
      );
      const result = simnet.callPublicFn(
        "deadman-vault-extensions",
        "set-vault-metadata",
        [Cl.uint(1), Cl.stringAscii("Updated"), Cl.uint(2)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });
  });

  describe("get-vault-metadata", () => {
    it("returns none for vault without metadata", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);
      const result = simnet.callReadOnlyFn("deadman-vault-extensions", "get-vault-metadata", [Cl.uint(1)], deployer);
      expect(result.result).toBeNone();
    });

    it("returns metadata after set", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);
      simnet.callPublicFn(
        "deadman-vault-extensions",
        "set-vault-metadata",
        [Cl.uint(1), Cl.stringAscii("Test Vault"), Cl.uint(3)],
        wallet1
      );
      const result = simnet.callReadOnlyFn("deadman-vault-extensions", "get-vault-metadata", [Cl.uint(1)], deployer);
      expect(result.result).toBeSome(
        Cl.tuple({
          name: Cl.stringAscii("Test Vault"),
          category: Cl.uint(3),
        })
      );
    });
  });

  describe("get-vault-name", () => {
    it("returns none for vault without metadata", () => {
      const result = simnet.callReadOnlyFn("deadman-vault-extensions", "get-vault-name", [Cl.uint(1)], deployer);
      expect(result.result).toBeNone();
    });

    it("returns name after set", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);
      simnet.callPublicFn(
        "deadman-vault-extensions",
        "set-vault-metadata",
        [Cl.uint(1), Cl.stringAscii("Named Vault"), Cl.uint(0)],
        wallet1
      );
      const result = simnet.callReadOnlyFn("deadman-vault-extensions", "get-vault-name", [Cl.uint(1)], deployer);
      expect(result.result).toBeSome(Cl.stringAscii("Named Vault"));
    });
  });

  describe("get-vault-category", () => {
    it("returns category after set", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);
      simnet.callPublicFn(
        "deadman-vault-extensions",
        "set-vault-metadata",
        [Cl.uint(1), Cl.stringAscii("Cat Vault"), Cl.uint(42)],
        wallet1
      );
      const result = simnet.callReadOnlyFn("deadman-vault-extensions", "get-vault-category", [Cl.uint(1)], deployer);
      expect(result.result).toBeSome(Cl.uint(42));
    });
  });
});
