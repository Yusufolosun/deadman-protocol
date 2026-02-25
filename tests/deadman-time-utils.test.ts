import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("deadman-time-utils", () => {
  describe("get-current-block", () => {
    it("returns the current block height", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-time-utils",
        "get-current-block",
        [],
        deployer
      );
      expect(result.result).toBeUint(simnet.blockHeight);
    });
  });

  describe("blocks-to-minutes", () => {
    it("converts blocks to approximate minutes (10 min/block)", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-time-utils",
        "blocks-to-minutes",
        [Cl.uint(6)],
        deployer
      );
      expect(result.result).toBeUint(60); // 6 blocks * 10 min
    });

    it("returns 0 for 0 blocks", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-time-utils",
        "blocks-to-minutes",
        [Cl.uint(0)],
        deployer
      );
      expect(result.result).toBeUint(0);
    });
  });

  describe("blocks-to-hours", () => {
    it("converts blocks to approximate hours", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-time-utils",
        "blocks-to-hours",
        [Cl.uint(6)],
        deployer
      );
      expect(result.result).toBeUint(1); // 6 blocks * 10 min = 60 min = 1 hour
    });
  });

  describe("blocks-to-days", () => {
    it("converts blocks to approximate days", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-time-utils",
        "blocks-to-days",
        [Cl.uint(144)],
        deployer
      );
      expect(result.result).toBeUint(1); // 144 blocks = 1 day
    });

    it("returns 0 for less than a day of blocks", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-time-utils",
        "blocks-to-days",
        [Cl.uint(100)],
        deployer
      );
      expect(result.result).toBeUint(0);
    });
  });

  describe("days-to-blocks", () => {
    it("converts days to block count", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-time-utils",
        "days-to-blocks",
        [Cl.uint(7)],
        deployer
      );
      expect(result.result).toBeUint(1008); // 7 * 144
    });
  });

  describe("hours-to-blocks", () => {
    it("converts hours to block count", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-time-utils",
        "hours-to-blocks",
        [Cl.uint(24)],
        deployer
      );
      expect(result.result).toBeUint(144); // 24 * 6
    });
  });

  describe("blocks-remaining", () => {
    it("returns blocks remaining until target", () => {
      const target = simnet.blockHeight + 100;
      const result = simnet.callReadOnlyFn(
        "deadman-time-utils",
        "blocks-remaining",
        [Cl.uint(target)],
        deployer
      );
      expect(result.result).toBeUint(100);
    });

    it("returns 0 if target already passed", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-time-utils",
        "blocks-remaining",
        [Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeUint(0);
    });
  });

  describe("is-past-target", () => {
    it("returns true if target block is past", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-time-utils",
        "is-past-target",
        [Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeBool(true);
    });

    it("returns false if target block is in the future", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-time-utils",
        "is-past-target",
        [Cl.uint(simnet.blockHeight + 100)],
        deployer
      );
      expect(result.result).toBeBool(false);
    });
  });
});
