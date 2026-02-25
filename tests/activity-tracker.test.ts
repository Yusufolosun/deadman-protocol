import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("activity-tracker", () => {
  describe("ping", () => {
    it("records the current block height for the caller", () => {
      const result = simnet.callPublicFn(
        "activity-tracker",
        "ping",
        [],
        wallet1
      );
      expect(result.result).toBeOk(Cl.uint(simnet.blockHeight));
    });

    it("allows multiple principals to ping independently", () => {
      simnet.callPublicFn("activity-tracker", "ping", [], wallet1);
      simnet.callPublicFn("activity-tracker", "ping", [], wallet2);

      const last1 = simnet.callReadOnlyFn(
        "activity-tracker",
        "get-last-active",
        [Cl.principal(wallet1)],
        deployer
      );
      const last2 = simnet.callReadOnlyFn(
        "activity-tracker",
        "get-last-active",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(last1.result).not.toBeNone();
      expect(last2.result).not.toBeNone();
    });

    it("updates the block height on subsequent pings", () => {
      simnet.callPublicFn("activity-tracker", "ping", [], wallet1);
      const firstBlock = simnet.blockHeight;

      simnet.mineEmptyBlocks(10);

      simnet.callPublicFn("activity-tracker", "ping", [], wallet1);
      const secondBlock = simnet.blockHeight;

      expect(secondBlock).toBeGreaterThan(firstBlock);

      const lastActive = simnet.callReadOnlyFn(
        "activity-tracker",
        "get-last-active",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(lastActive.result).toBeSome(Cl.uint(secondBlock));
    });
  });

  describe("get-last-active", () => {
    it("returns none for a principal that has never pinged", () => {
      const result = simnet.callReadOnlyFn(
        "activity-tracker",
        "get-last-active",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(result.result).toBeNone();
    });

    it("returns the block height after a ping", () => {
      simnet.callPublicFn("activity-tracker", "ping", [], wallet1);
      const result = simnet.callReadOnlyFn(
        "activity-tracker",
        "get-last-active",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeSome(Cl.uint(simnet.blockHeight));
    });
  });

  describe("is-inactive", () => {
    it("considers a never-pinged principal inactive after enough blocks", () => {
      simnet.mineEmptyBlocks(15);

      const result = simnet.callReadOnlyFn(
        "activity-tracker",
        "is-inactive",
        [Cl.principal(wallet2), Cl.uint(10)],
        deployer
      );
      expect(result.result).toBeBool(true);
    });

    it("returns false immediately after a ping", () => {
      simnet.callPublicFn("activity-tracker", "ping", [], wallet1);
      const result = simnet.callReadOnlyFn(
        "activity-tracker",
        "is-inactive",
        [Cl.principal(wallet1), Cl.uint(10)],
        deployer
      );
      expect(result.result).toBeBool(false);
    });

    it("returns true after sufficient blocks have passed since last ping", () => {
      simnet.callPublicFn("activity-tracker", "ping", [], wallet1);
      simnet.mineEmptyBlocks(20);

      const result = simnet.callReadOnlyFn(
        "activity-tracker",
        "is-inactive",
        [Cl.principal(wallet1), Cl.uint(10)],
        deployer
      );
      expect(result.result).toBeBool(true);
    });

    it("returns false when blocks passed is below threshold", () => {
      simnet.callPublicFn("activity-tracker", "ping", [], wallet1);
      simnet.mineEmptyBlocks(3);

      const result = simnet.callReadOnlyFn(
        "activity-tracker",
        "is-inactive",
        [Cl.principal(wallet1), Cl.uint(10)],
        deployer
      );
      expect(result.result).toBeBool(false);
    });
  });
});
