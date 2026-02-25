import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("deadman-emergency-stop", () => {
  describe("add-guardian / remove-guardian", () => {
    it("allows deployer to add a guardian", () => {
      const result = simnet.callPublicFn(
        "deadman-emergency-stop",
        "add-guardian",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-deployer adding guardians", () => {
      const result = simnet.callPublicFn(
        "deadman-emergency-stop",
        "add-guardian",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(1300));
    });

    it("allows deployer to remove a guardian", () => {
      simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet1)], deployer);
      const result = simnet.callPublicFn(
        "deadman-emergency-stop",
        "remove-guardian",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });
  });

  describe("set-vote-threshold", () => {
    it("allows deployer to set threshold", () => {
      const result = simnet.callPublicFn(
        "deadman-emergency-stop",
        "set-vote-threshold",
        [Cl.uint(3)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-deployer", () => {
      const result = simnet.callPublicFn(
        "deadman-emergency-stop",
        "set-vote-threshold",
        [Cl.uint(3)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(1300));
    });
  });

  describe("vote-emergency-stop", () => {
    it("rejects non-guardian votes", () => {
      const result = simnet.callPublicFn(
        "deadman-emergency-stop",
        "vote-emergency-stop",
        [],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(1301));
    });

    it("allows guardian to vote", () => {
      simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet1)], deployer);
      const result = simnet.callPublicFn(
        "deadman-emergency-stop",
        "vote-emergency-stop",
        [],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(false)); // not yet at threshold
    });

    it("rejects duplicate votes in same round", () => {
      simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet1)], deployer);
      simnet.callPublicFn("deadman-emergency-stop", "vote-emergency-stop", [], wallet1);
      const result = simnet.callPublicFn(
        "deadman-emergency-stop",
        "vote-emergency-stop",
        [],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(1302));
    });

    it("activates emergency when threshold reached", () => {
      simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet1)], deployer);
      simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet2)], deployer);
      simnet.callPublicFn("deadman-emergency-stop", "set-vote-threshold", [Cl.uint(2)], deployer);

      simnet.callPublicFn("deadman-emergency-stop", "vote-emergency-stop", [], wallet1);
      const result = simnet.callPublicFn("deadman-emergency-stop", "vote-emergency-stop", [], wallet2);
      expect(result.result).toBeOk(Cl.bool(true)); // threshold met

      const status = simnet.callReadOnlyFn("deadman-emergency-stop", "is-emergency", [], deployer);
      expect(status.result).toBeBool(true);
    });

    it("rejects votes when already in emergency", () => {
      simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet1)], deployer);
      simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet2)], deployer);
      simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet3)], deployer);
      simnet.callPublicFn("deadman-emergency-stop", "set-vote-threshold", [Cl.uint(2)], deployer);
      simnet.callPublicFn("deadman-emergency-stop", "vote-emergency-stop", [], wallet1);
      simnet.callPublicFn("deadman-emergency-stop", "vote-emergency-stop", [], wallet2);

      const result = simnet.callPublicFn("deadman-emergency-stop", "vote-emergency-stop", [], wallet3);
      expect(result.result).toBeErr(Cl.uint(1304));
    });
  });

  describe("resolve-emergency", () => {
    it("rejects when not in emergency", () => {
      const result = simnet.callPublicFn("deadman-emergency-stop", "resolve-emergency", [], deployer);
      expect(result.result).toBeErr(Cl.uint(1303));
    });

    it("rejects non-deployer resolve", () => {
      simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet1)], deployer);
      simnet.callPublicFn("deadman-emergency-stop", "set-vote-threshold", [Cl.uint(1)], deployer);
      simnet.callPublicFn("deadman-emergency-stop", "vote-emergency-stop", [], wallet1);

      const result = simnet.callPublicFn("deadman-emergency-stop", "resolve-emergency", [], wallet1);
      expect(result.result).toBeErr(Cl.uint(1300));
    });

    it("rejects resolve during cooldown", () => {
      simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet1)], deployer);
      simnet.callPublicFn("deadman-emergency-stop", "set-vote-threshold", [Cl.uint(1)], deployer);
      simnet.callPublicFn("deadman-emergency-stop", "vote-emergency-stop", [], wallet1);

      // Try to resolve immediately (cooldown is 144 blocks)
      const result = simnet.callPublicFn("deadman-emergency-stop", "resolve-emergency", [], deployer);
      expect(result.result).toBeErr(Cl.uint(1305));
    });
  });

  describe("read-only functions", () => {
    it("is-emergency defaults to false", () => {
      const result = simnet.callReadOnlyFn("deadman-emergency-stop", "is-emergency", [], deployer);
      expect(result.result).toBeBool(false);
    });

    it("is-guardian returns false for non-guardian", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-emergency-stop",
        "is-guardian",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeBool(false);
    });

    it("is-guardian returns true for added guardian", () => {
      simnet.callPublicFn("deadman-emergency-stop", "add-guardian", [Cl.principal(wallet1)], deployer);
      const result = simnet.callReadOnlyFn(
        "deadman-emergency-stop",
        "is-guardian",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeBool(true);
    });

    it("get-vote-threshold returns default (2)", () => {
      const result = simnet.callReadOnlyFn("deadman-emergency-stop", "get-vote-threshold", [], deployer);
      expect(result.result).toBeUint(2);
    });
  });
});
