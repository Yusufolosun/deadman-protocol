import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("admin-config", () => {
  describe("get-config", () => {
    it("returns default configuration values", () => {
      const result = simnet.callReadOnlyFn(
        "admin-config",
        "get-config",
        [],
        deployer
      );
      expect(result.result).toBeTuple({
        "min-lock-blocks": Cl.uint(144),
        "max-cosigners": Cl.uint(5),
        "max-beneficiaries": Cl.uint(5),
        paused: Cl.bool(false),
      });
    });
  });

  describe("get-min-lock-blocks", () => {
    it("returns default min lock blocks", () => {
      const result = simnet.callReadOnlyFn(
        "admin-config",
        "get-min-lock-blocks",
        [],
        deployer
      );
      expect(result.result).toBeUint(144);
    });
  });

  describe("get-max-cosigners", () => {
    it("returns default max cosigners", () => {
      const result = simnet.callReadOnlyFn(
        "admin-config",
        "get-max-cosigners",
        [],
        deployer
      );
      expect(result.result).toBeUint(5);
    });
  });

  describe("get-max-beneficiaries", () => {
    it("returns default max beneficiaries", () => {
      const result = simnet.callReadOnlyFn(
        "admin-config",
        "get-max-beneficiaries",
        [],
        deployer
      );
      expect(result.result).toBeUint(5);
    });
  });

  describe("is-paused", () => {
    it("returns false by default", () => {
      const result = simnet.callReadOnlyFn(
        "admin-config",
        "is-paused",
        [],
        deployer
      );
      expect(result.result).toBeBool(false);
    });
  });

  describe("set-min-lock-blocks", () => {
    it("allows deployer to update min lock blocks", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-min-lock-blocks",
        [Cl.uint(288)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const read = simnet.callReadOnlyFn(
        "admin-config",
        "get-min-lock-blocks",
        [],
        deployer
      );
      expect(read.result).toBeUint(288);
    });

    it("rejects non-deployer callers", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-min-lock-blocks",
        [Cl.uint(288)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(100));
    });

    it("rejects zero value", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-min-lock-blocks",
        [Cl.uint(0)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(101));
    });
  });

  describe("set-max-cosigners", () => {
    it("allows deployer to update max cosigners", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-max-cosigners",
        [Cl.uint(8)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const read = simnet.callReadOnlyFn(
        "admin-config",
        "get-max-cosigners",
        [],
        deployer
      );
      expect(read.result).toBeUint(8);
    });

    it("rejects non-deployer callers", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-max-cosigners",
        [Cl.uint(3)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(100));
    });

    it("rejects zero value", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-max-cosigners",
        [Cl.uint(0)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(101));
    });

    it("rejects values above 10", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-max-cosigners",
        [Cl.uint(11)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(101));
    });

    it("accepts boundary value of 10", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-max-cosigners",
        [Cl.uint(10)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });
  });

  describe("set-max-beneficiaries", () => {
    it("allows deployer to update max beneficiaries", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-max-beneficiaries",
        [Cl.uint(3)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const read = simnet.callReadOnlyFn(
        "admin-config",
        "get-max-beneficiaries",
        [],
        deployer
      );
      expect(read.result).toBeUint(3);
    });

    it("rejects non-deployer callers", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-max-beneficiaries",
        [Cl.uint(3)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(100));
    });

    it("rejects zero value", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-max-beneficiaries",
        [Cl.uint(0)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(101));
    });

    it("rejects values above 10", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-max-beneficiaries",
        [Cl.uint(11)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(101));
    });
  });

  describe("set-paused", () => {
    it("allows deployer to pause protocol", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-paused",
        [Cl.bool(true)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const read = simnet.callReadOnlyFn(
        "admin-config",
        "is-paused",
        [],
        deployer
      );
      expect(read.result).toBeBool(true);
    });

    it("allows deployer to unpause protocol", () => {
      simnet.callPublicFn("admin-config", "set-paused", [Cl.bool(true)], deployer);

      const result = simnet.callPublicFn(
        "admin-config",
        "set-paused",
        [Cl.bool(false)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));

      const read = simnet.callReadOnlyFn(
        "admin-config",
        "is-paused",
        [],
        deployer
      );
      expect(read.result).toBeBool(false);
    });

    it("rejects non-deployer callers", () => {
      const result = simnet.callPublicFn(
        "admin-config",
        "set-paused",
        [Cl.bool(true)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(100));
    });
  });
});
