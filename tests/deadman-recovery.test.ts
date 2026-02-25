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

// Create a vault for testing recovery
function createTestVault(owner: string, beneficiary: string) {
  return simnet.callPublicFn(
    "deadman-vault-core-v2",
    "create-vault",
    [Cl.uint(1000000), Cl.uint(1), Cl.uint(simnet.blockHeight + 200), Cl.uint(0), Cl.uint(0), Cl.principal(beneficiary)],
    owner
  );
}

describe("deadman-recovery", () => {
  describe("request-recovery", () => {
    it("allows vault owner to request recovery", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);

      const result = simnet.callPublicFn(
        "deadman-recovery",
        "request-recovery",
        [Cl.uint(1), Cl.stringAscii("Release failed due to network issue")],
        wallet1
      );
      expect(result.result).toBeOk(Cl.uint(1));
    });

    it("allows deployer to request recovery for any vault", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);

      const result = simnet.callPublicFn(
        "deadman-recovery",
        "request-recovery",
        [Cl.uint(1), Cl.stringAscii("Admin initiated recovery")],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(1));
    });

    it("rejects non-owner non-deployer requests", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);

      const result = simnet.callPublicFn(
        "deadman-recovery",
        "request-recovery",
        [Cl.uint(1), Cl.stringAscii("unauthorized")],
        wallet2
      );
      expect(result.result).toBeErr(Cl.uint(1400));
    });

    it("rejects recovery for non-existent vault", () => {
      const result = simnet.callPublicFn(
        "deadman-recovery",
        "request-recovery",
        [Cl.uint(999), Cl.stringAscii("ghost vault")],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(1404));
    });

    it("rejects duplicate recovery for same vault", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);

      simnet.callPublicFn("deadman-recovery", "request-recovery", [Cl.uint(1), Cl.stringAscii("first")], wallet1);
      const result = simnet.callPublicFn("deadman-recovery", "request-recovery", [Cl.uint(1), Cl.stringAscii("second")], wallet1);
      expect(result.result).toBeErr(Cl.uint(1402));
    });

    it("increments recovery IDs", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);
      createTestVault(wallet1, wallet2);

      const r1 = simnet.callPublicFn("deadman-recovery", "request-recovery", [Cl.uint(1), Cl.stringAscii("first")], wallet1);
      const r2 = simnet.callPublicFn("deadman-recovery", "request-recovery", [Cl.uint(2), Cl.stringAscii("second")], wallet1);
      expect(r1.result).toBeOk(Cl.uint(1));
      expect(r2.result).toBeOk(Cl.uint(2));
    });
  });

  describe("resolve-recovery", () => {
    it("allows deployer to resolve (approve)", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);
      simnet.callPublicFn("deadman-recovery", "request-recovery", [Cl.uint(1), Cl.stringAscii("issue")], wallet1);

      const result = simnet.callPublicFn(
        "deadman-recovery",
        "resolve-recovery",
        [Cl.uint(1), Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("allows deployer to reject", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);
      simnet.callPublicFn("deadman-recovery", "request-recovery", [Cl.uint(1), Cl.stringAscii("issue")], wallet1);

      const result = simnet.callPublicFn(
        "deadman-recovery",
        "resolve-recovery",
        [Cl.uint(1), Cl.uint(2)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-deployer resolve", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);
      simnet.callPublicFn("deadman-recovery", "request-recovery", [Cl.uint(1), Cl.stringAscii("issue")], wallet1);

      const result = simnet.callPublicFn("deadman-recovery", "resolve-recovery", [Cl.uint(1), Cl.uint(1)], wallet1);
      expect(result.result).toBeErr(Cl.uint(1400));
    });

    it("rejects resolve for non-existent recovery", () => {
      const result = simnet.callPublicFn("deadman-recovery", "resolve-recovery", [Cl.uint(99), Cl.uint(1)], deployer);
      expect(result.result).toBeErr(Cl.uint(1401));
    });

    it("rejects resolving already-resolved recovery", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);
      simnet.callPublicFn("deadman-recovery", "request-recovery", [Cl.uint(1), Cl.stringAscii("issue")], wallet1);
      simnet.callPublicFn("deadman-recovery", "resolve-recovery", [Cl.uint(1), Cl.uint(1)], deployer);

      const result = simnet.callPublicFn("deadman-recovery", "resolve-recovery", [Cl.uint(1), Cl.uint(1)], deployer);
      expect(result.result).toBeErr(Cl.uint(1403));
    });
  });

  describe("read-only functions", () => {
    it("get-recovery returns none for non-existent", () => {
      const result = simnet.callReadOnlyFn("deadman-recovery", "get-recovery", [Cl.uint(99)], deployer);
      expect(result.result).toBeNone();
    });

    it("get-vault-recovery returns none for vault without recovery", () => {
      const result = simnet.callReadOnlyFn("deadman-recovery", "get-vault-recovery", [Cl.uint(1)], deployer);
      expect(result.result).toBeNone();
    });

    it("get-next-recovery-id starts at 1", () => {
      const result = simnet.callReadOnlyFn("deadman-recovery", "get-next-recovery-id", [], deployer);
      expect(result.result).toBeUint(1);
    });

    it("get-recovery returns data after request", () => {
      setupAuthorizedCallers();
      createTestVault(wallet1, wallet2);
      simnet.callPublicFn("deadman-recovery", "request-recovery", [Cl.uint(1), Cl.stringAscii("test reason")], wallet1);

      const result = simnet.callReadOnlyFn("deadman-recovery", "get-recovery", [Cl.uint(1)], deployer);
      const tupleData = result.result;
      const entry = (tupleData as any).value.value;
      expect(entry["vault-id"]).toStrictEqual(Cl.uint(1));
      expect(entry.requester).toStrictEqual(Cl.principal(wallet1));
      expect(entry.reason).toStrictEqual(Cl.stringAscii("test reason"));
      expect(entry.status).toStrictEqual(Cl.uint(0));
      expect(entry["resolved-at"]).toStrictEqual(Cl.uint(0));
    });
  });
});
