import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("deadman-vault-registry", () => {
  describe("set-authorized-caller", () => {
    it("allows deployer to set authorized caller", () => {
      const result = simnet.callPublicFn(
        "deadman-vault-registry",
        "set-authorized-caller",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-deployer", () => {
      const result = simnet.callPublicFn(
        "deadman-vault-registry",
        "set-authorized-caller",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(800));
    });
  });

  describe("register-vault", () => {
    it("allows deployer to register a vault", () => {
      const result = simnet.callPublicFn(
        "deadman-vault-registry",
        "register-vault",
        [Cl.uint(1), Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects duplicate registration", () => {
      simnet.callPublicFn(
        "deadman-vault-registry",
        "register-vault",
        [Cl.uint(1), Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );
      const result = simnet.callPublicFn(
        "deadman-vault-registry",
        "register-vault",
        [Cl.uint(1), Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(801));
    });

    it("rejects unauthorized callers", () => {
      simnet.callPublicFn(
        "deadman-vault-registry",
        "set-authorized-caller",
        [Cl.principal(wallet1)],
        deployer
      );
      const result = simnet.callPublicFn(
        "deadman-vault-registry",
        "register-vault",
        [Cl.uint(2), Cl.principal(wallet2), Cl.principal(deployer)],
        wallet2
      );
      expect(result.result).toBeErr(Cl.uint(800));
    });

    it("increments total-vaults count", () => {
      simnet.callPublicFn(
        "deadman-vault-registry",
        "register-vault",
        [Cl.uint(1), Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );
      simnet.callPublicFn(
        "deadman-vault-registry",
        "register-vault",
        [Cl.uint(2), Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );
      const result = simnet.callReadOnlyFn("deadman-vault-registry", "get-total-vaults", [], deployer);
      expect(result.result).toBeUint(2);
    });
  });

  describe("get-vault-entry", () => {
    it("returns none for unregistered vault", () => {
      const result = simnet.callReadOnlyFn("deadman-vault-registry", "get-vault-entry", [Cl.uint(99)], deployer);
      expect(result.result).toBeNone();
    });

    it("returns entry after registration", () => {
      simnet.callPublicFn(
        "deadman-vault-registry",
        "register-vault",
        [Cl.uint(1), Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );
      const result = simnet.callReadOnlyFn("deadman-vault-registry", "get-vault-entry", [Cl.uint(1)], deployer);
      const entry = (result.result as any).value.value;
      expect(entry.owner).toStrictEqual(Cl.principal(wallet1));
      expect(entry.status).toStrictEqual(Cl.uint(0));
    });
  });

  describe("update-vault-status", () => {
    it("updates status of registered vault", () => {
      simnet.callPublicFn(
        "deadman-vault-registry",
        "register-vault",
        [Cl.uint(1), Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );
      const result = simnet.callPublicFn(
        "deadman-vault-registry",
        "update-vault-status",
        [Cl.uint(1), Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects update for unregistered vault", () => {
      const result = simnet.callPublicFn(
        "deadman-vault-registry",
        "update-vault-status",
        [Cl.uint(99), Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(802));
    });
  });

  describe("beneficiary lookups", () => {
    it("tracks beneficiary vault count", () => {
      simnet.callPublicFn(
        "deadman-vault-registry",
        "register-vault",
        [Cl.uint(1), Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );
      simnet.callPublicFn(
        "deadman-vault-registry",
        "register-vault",
        [Cl.uint(2), Cl.principal(deployer), Cl.principal(wallet2)],
        deployer
      );
      const count = simnet.callReadOnlyFn(
        "deadman-vault-registry",
        "get-beneficiary-vault-count",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(count.result).toBeUint(2);
    });

    it("provides reverse lookup by beneficiary index", () => {
      simnet.callPublicFn(
        "deadman-vault-registry",
        "register-vault",
        [Cl.uint(10), Cl.principal(wallet1), Cl.principal(wallet2)],
        deployer
      );
      const vaultId = simnet.callReadOnlyFn(
        "deadman-vault-registry",
        "get-beneficiary-vault-id",
        [Cl.principal(wallet2), Cl.uint(0)],
        deployer
      );
      expect(vaultId.result).toBeSome(Cl.uint(10));
    });
  });

  describe("status-count", () => {
    it("tracks counts per status", () => {
      simnet.callPublicFn("deadman-vault-registry", "register-vault", [Cl.uint(1), Cl.principal(wallet1), Cl.principal(wallet2)], deployer);
      simnet.callPublicFn("deadman-vault-registry", "register-vault", [Cl.uint(2), Cl.principal(wallet1), Cl.principal(wallet2)], deployer);
      // Both are status 0 (active)
      const active = simnet.callReadOnlyFn("deadman-vault-registry", "get-status-count", [Cl.uint(0)], deployer);
      expect(active.result).toBeUint(2);

      // Release one
      simnet.callPublicFn("deadman-vault-registry", "update-vault-status", [Cl.uint(1), Cl.uint(1)], deployer);
      const activeAfter = simnet.callReadOnlyFn("deadman-vault-registry", "get-status-count", [Cl.uint(0)], deployer);
      const released = simnet.callReadOnlyFn("deadman-vault-registry", "get-status-count", [Cl.uint(1)], deployer);
      expect(activeAfter.result).toBeUint(1);
      expect(released.result).toBeUint(1);
    });
  });
});
