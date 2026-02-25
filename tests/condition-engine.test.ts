import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("condition-engine", () => {
  describe("check-block-height", () => {
    it("returns false when current block is below target", () => {
      const result = simnet.callReadOnlyFn(
        "condition-engine",
        "check-block-height",
        [Cl.uint(999999)],
        deployer
      );
      expect(result.result).toBeBool(false);
    });

    it("returns true when current block meets target", () => {
      const target = simnet.blockHeight;
      const result = simnet.callReadOnlyFn(
        "condition-engine",
        "check-block-height",
        [Cl.uint(target)],
        deployer
      );
      expect(result.result).toBeBool(true);
    });

    it("returns true when current block exceeds target", () => {
      const result = simnet.callReadOnlyFn(
        "condition-engine",
        "check-block-height",
        [Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeBool(true);
    });
  });

  describe("check-inactivity", () => {
    it("returns true for inactive principal after enough blocks", () => {
      simnet.callPublicFn("activity-tracker", "ping", [], wallet1);
      simnet.mineEmptyBlocks(20);

      const result = simnet.callReadOnlyFn(
        "condition-engine",
        "check-inactivity",
        [Cl.principal(wallet1), Cl.uint(10)],
        deployer
      );
      expect(result.result).toBeBool(true);
    });

    it("returns false for recently active principal", () => {
      simnet.callPublicFn("activity-tracker", "ping", [], wallet1);

      const result = simnet.callReadOnlyFn(
        "condition-engine",
        "check-inactivity",
        [Cl.principal(wallet1), Cl.uint(100)],
        deployer
      );
      expect(result.result).toBeBool(false);
    });
  });

  describe("check-threshold", () => {
    it("returns true when approvals meet threshold", () => {
      const result = simnet.callReadOnlyFn(
        "condition-engine",
        "check-threshold",
        [Cl.uint(3), Cl.uint(3)],
        deployer
      );
      expect(result.result).toBeBool(true);
    });

    it("returns true when approvals exceed threshold", () => {
      const result = simnet.callReadOnlyFn(
        "condition-engine",
        "check-threshold",
        [Cl.uint(5), Cl.uint(3)],
        deployer
      );
      expect(result.result).toBeBool(true);
    });

    it("returns false when approvals are below threshold", () => {
      const result = simnet.callReadOnlyFn(
        "condition-engine",
        "check-threshold",
        [Cl.uint(1), Cl.uint(3)],
        deployer
      );
      expect(result.result).toBeBool(false);
    });
  });

  describe("evaluate-condition", () => {
    it("evaluates block-height condition (type u1)", () => {
      const result = simnet.callReadOnlyFn(
        "condition-engine",
        "evaluate-condition",
        [
          Cl.uint(1),              // condition-type: block-height
          Cl.principal(wallet1),   // owner
          Cl.uint(1),              // target-block (already passed)
          Cl.uint(0),              // inactivity-blocks (unused)
          Cl.uint(0),              // approval-count (unused)
          Cl.uint(0),              // required-threshold (unused)
        ],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("evaluates inactivity condition (type u2)", () => {
      simnet.callPublicFn("activity-tracker", "ping", [], wallet1);

      const result = simnet.callReadOnlyFn(
        "condition-engine",
        "evaluate-condition",
        [
          Cl.uint(2),              // condition-type: inactivity
          Cl.principal(wallet1),   // owner
          Cl.uint(0),              // target-block (unused)
          Cl.uint(1000),           // inactivity-blocks
          Cl.uint(0),              // approval-count (unused)
          Cl.uint(0),              // required-threshold (unused)
        ],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(false));
    });

    it("evaluates threshold condition (type u3)", () => {
      const result = simnet.callReadOnlyFn(
        "condition-engine",
        "evaluate-condition",
        [
          Cl.uint(3),              // condition-type: threshold
          Cl.principal(wallet1),   // owner (unused)
          Cl.uint(0),              // target-block (unused)
          Cl.uint(0),              // inactivity-blocks (unused)
          Cl.uint(3),              // approval-count
          Cl.uint(2),              // required-threshold
        ],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("returns error for unknown condition type", () => {
      const result = simnet.callReadOnlyFn(
        "condition-engine",
        "evaluate-condition",
        [
          Cl.uint(99),
          Cl.principal(wallet1),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
        ],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(400));
    });
  });
});
