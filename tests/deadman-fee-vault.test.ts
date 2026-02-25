import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("deadman-fee-vault", () => {
  describe("set-fee-rate", () => {
    it("allows deployer to set fee rate", () => {
      const result = simnet.callPublicFn(
        "deadman-fee-vault",
        "set-fee-rate",
        [Cl.uint(100)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-deployer", () => {
      const result = simnet.callPublicFn(
        "deadman-fee-vault",
        "set-fee-rate",
        [Cl.uint(100)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(700));
    });

    it("rejects rate above 1000 bps (10%)", () => {
      const result = simnet.callPublicFn(
        "deadman-fee-vault",
        "set-fee-rate",
        [Cl.uint(1001)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(701));
    });

    it("allows 0 rate (no fees)", () => {
      const result = simnet.callPublicFn(
        "deadman-fee-vault",
        "set-fee-rate",
        [Cl.uint(0)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });
  });

  describe("get-fee-rate / calculate-fee", () => {
    it("returns default fee rate (50 bps)", () => {
      const result = simnet.callReadOnlyFn("deadman-fee-vault", "get-fee-rate", [], deployer);
      expect(result.result).toBeUint(50);
    });

    it("calculates fee for a given amount", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-fee-vault",
        "calculate-fee",
        [Cl.uint(1000000)],
        deployer
      );
      // 1000000 * 50 / 10000 = 5000
      expect(result.result).toBeUint(5000);
    });
  });

  describe("collect-fee", () => {
    it("rejects unauthorized callers", () => {
      const result = simnet.callPublicFn(
        "deadman-fee-vault",
        "collect-fee",
        [Cl.uint(1000000)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(700));
    });

    it("collects fee when called by deployer", () => {
      const result = simnet.callPublicFn(
        "deadman-fee-vault",
        "collect-fee",
        [Cl.uint(1000000)],
        deployer
      );
      // Default 50 bps: 1000000 * 50 / 10000 = 5000
      expect(result.result).toBeOk(Cl.uint(5000));
    });

    it("returns 0 when fee rate is 0", () => {
      simnet.callPublicFn("deadman-fee-vault", "set-fee-rate", [Cl.uint(0)], deployer);
      const result = simnet.callPublicFn(
        "deadman-fee-vault",
        "collect-fee",
        [Cl.uint(1000000)],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(0));
    });

    it("increments total-collected", () => {
      // Reset fee rate to default
      simnet.callPublicFn("deadman-fee-vault", "set-fee-rate", [Cl.uint(50)], deployer);
      simnet.callPublicFn("deadman-fee-vault", "collect-fee", [Cl.uint(1000000)], deployer);
      const total = simnet.callReadOnlyFn("deadman-fee-vault", "get-total-collected", [], deployer);
      // 1000000 * 50 / 10000 = 5000
      expect(total.result).toBeUint(5000);
    });
  });

  describe("set-authorized-caller", () => {
    it("allows deployer to set authorized caller", () => {
      const result = simnet.callPublicFn(
        "deadman-fee-vault",
        "set-authorized-caller",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-deployer", () => {
      const result = simnet.callPublicFn(
        "deadman-fee-vault",
        "set-authorized-caller",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(700));
    });
  });

  describe("withdraw-fees", () => {
    it("rejects when no fees collected", () => {
      const result = simnet.callPublicFn(
        "deadman-fee-vault",
        "withdraw-fees",
        [],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(702));
    });

    it("rejects non-deployer withdraw", () => {
      const result = simnet.callPublicFn(
        "deadman-fee-vault",
        "withdraw-fees",
        [],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(700));
    });
  });
});
