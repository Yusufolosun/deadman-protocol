import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const wallet4 = accounts.get("wallet_4")!;

describe("delegation-registry", () => {
  describe("set-authorized-caller", () => {
    it("allows deployer to set authorized caller", () => {
      const result = simnet.callPublicFn(
        "delegation-registry",
        "set-authorized-caller",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-deployer callers", () => {
      const result = simnet.callPublicFn(
        "delegation-registry",
        "set-authorized-caller",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(300));
    });
  });

  describe("set-beneficiary", () => {
    it("allows deployer to set beneficiary for a vault", () => {
      const result = simnet.callPublicFn(
        "delegation-registry",
        "set-beneficiary",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents self-delegation", () => {
      const result = simnet.callPublicFn(
        "delegation-registry",
        "set-beneficiary",
        [Cl.uint(1), Cl.principal(wallet1), Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(301));
    });

    it("rejects unauthorized callers", () => {
      const result = simnet.callPublicFn(
        "delegation-registry",
        "set-beneficiary",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1)],
        wallet3
      );
      expect(result.result).toBeErr(Cl.uint(300));
    });
  });

  describe("get-beneficiary", () => {
    it("returns none for vault with no beneficiary", () => {
      const result = simnet.callReadOnlyFn(
        "delegation-registry",
        "get-beneficiary",
        [Cl.uint(999)],
        deployer
      );
      expect(result.result).toBeNone();
    });

    it("returns the beneficiary after setting it", () => {
      simnet.callPublicFn(
        "delegation-registry",
        "set-beneficiary",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1)],
        deployer
      );
      const result = simnet.callReadOnlyFn(
        "delegation-registry",
        "get-beneficiary",
        [Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeSome(Cl.principal(wallet2));
    });
  });

  describe("add-cosigner", () => {
    it("allows adding a cosigner", () => {
      const result = simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("increments cosigner count", () => {
      simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet3), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );

      const result = simnet.callReadOnlyFn(
        "delegation-registry",
        "get-cosigner-count",
        [Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeUint(2);
    });

    it("prevents self-delegation as cosigner", () => {
      const result = simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet1), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(301));
    });

    it("rejects when max cosigners reached", () => {
      // Add 2 cosigners with max of 2
      simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1), Cl.uint(2)],
        deployer
      );
      simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet3), Cl.principal(wallet1), Cl.uint(2)],
        deployer
      );
      // Third should fail
      const result = simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet4), Cl.principal(wallet1), Cl.uint(2)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(302));
    });

    it("rejects duplicate cosigner", () => {
      simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      // Adding the same cosigner again should fail
      const result = simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(306));
    });
  });

  describe("is-cosigner", () => {
    it("returns false for non-cosigner", () => {
      const result = simnet.callReadOnlyFn(
        "delegation-registry",
        "is-cosigner",
        [Cl.uint(1), Cl.principal(wallet4)],
        deployer
      );
      expect(result.result).toBeBool(false);
    });

    it("returns true for registered cosigner", () => {
      simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      const result = simnet.callReadOnlyFn(
        "delegation-registry",
        "is-cosigner",
        [Cl.uint(1), Cl.principal(wallet2)],
        deployer
      );
      expect(result.result).toBeBool(true);
    });
  });

  describe("get-cosigner", () => {
    it("returns none for empty slot", () => {
      const result = simnet.callReadOnlyFn(
        "delegation-registry",
        "get-cosigner",
        [Cl.uint(1), Cl.uint(0)],
        deployer
      );
      expect(result.result).toBeNone();
    });

    it("returns cosigner at the correct index", () => {
      simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet3), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      const first = simnet.callReadOnlyFn(
        "delegation-registry",
        "get-cosigner",
        [Cl.uint(1), Cl.uint(0)],
        deployer
      );
      expect(first.result).toBeSome(Cl.principal(wallet2));
      const second = simnet.callReadOnlyFn(
        "delegation-registry",
        "get-cosigner",
        [Cl.uint(1), Cl.uint(1)],
        deployer
      );
      expect(second.result).toBeSome(Cl.principal(wallet3));
    });
  });

  describe("submit-approval", () => {
    it("allows a registered cosigner to approve", () => {
      // Add wallet2 as cosigner for vault 1
      simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      const result = simnet.callPublicFn(
        "delegation-registry",
        "submit-approval",
        [Cl.uint(1)],
        wallet2
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-cosigner approval", () => {
      const result = simnet.callPublicFn(
        "delegation-registry",
        "submit-approval",
        [Cl.uint(1)],
        wallet4
      );
      expect(result.result).toBeErr(Cl.uint(305));
    });

    it("rejects duplicate approval", () => {
      simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      simnet.callPublicFn(
        "delegation-registry",
        "submit-approval",
        [Cl.uint(1)],
        wallet2
      );
      const result = simnet.callPublicFn(
        "delegation-registry",
        "submit-approval",
        [Cl.uint(1)],
        wallet2
      );
      expect(result.result).toBeErr(Cl.uint(304));
    });

    it("increments approval count", () => {
      simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet3), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      simnet.callPublicFn("delegation-registry", "submit-approval", [Cl.uint(1)], wallet2);
      simnet.callPublicFn("delegation-registry", "submit-approval", [Cl.uint(1)], wallet3);

      const result = simnet.callReadOnlyFn(
        "delegation-registry",
        "get-approval-count",
        [Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeUint(2);
    });
  });

  describe("has-approved", () => {
    it("returns false before approval", () => {
      const result = simnet.callReadOnlyFn(
        "delegation-registry",
        "has-approved",
        [Cl.uint(1), Cl.principal(wallet2)],
        deployer
      );
      expect(result.result).toBeBool(false);
    });

    it("returns true after approval", () => {
      simnet.callPublicFn(
        "delegation-registry",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      simnet.callPublicFn("delegation-registry", "submit-approval", [Cl.uint(1)], wallet2);

      const result = simnet.callReadOnlyFn(
        "delegation-registry",
        "has-approved",
        [Cl.uint(1), Cl.principal(wallet2)],
        deployer
      );
      expect(result.result).toBeBool(true);
    });
  });
});
