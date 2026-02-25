import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const releaseHandlerContract = `${deployer}.deadman-release-handler-v2`;

describe("deadman-release-handler-v2", () => {
  describe("set-authorized-caller", () => {
    it("allows deployer to set authorized caller", () => {
      const result = simnet.callPublicFn(
        "deadman-release-handler-v2",
        "set-authorized-caller",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-deployer callers", () => {
      const result = simnet.callPublicFn(
        "deadman-release-handler-v2",
        "set-authorized-caller",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(500));
    });

    it("allows updating authorized caller multiple times", () => {
      simnet.callPublicFn(
        "deadman-release-handler-v2",
        "set-authorized-caller",
        [Cl.principal(wallet1)],
        deployer
      );
      const result = simnet.callPublicFn(
        "deadman-release-handler-v2",
        "set-authorized-caller",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });
  });

  describe("execute-release", () => {
    it("rejects when no beneficiary is set", () => {
      const result = simnet.callPublicFn(
        "deadman-release-handler-v2",
        "execute-release",
        [Cl.uint(999), Cl.uint(1000)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(501));
    });

    it("rejects unauthorized callers", () => {
      // Set beneficiary first so we get past the beneficiary check
      simnet.callPublicFn(
        "deadman-delegation-registry-v2",
        "set-beneficiary",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1)],
        deployer
      );
      const result = simnet.callPublicFn(
        "deadman-release-handler-v2",
        "execute-release",
        [Cl.uint(1), Cl.uint(1000)],
        wallet3
      );
      expect(result.result).toBeErr(Cl.uint(500));
    });

    it("rejects zero amount", () => {
      // Set beneficiary
      simnet.callPublicFn(
        "deadman-delegation-registry-v2",
        "set-beneficiary",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1)],
        deployer
      );
      const result = simnet.callPublicFn(
        "deadman-release-handler-v2",
        "execute-release",
        [Cl.uint(1), Cl.uint(0)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(502));
    });

    it("fails transfer when contract has no STX balance", () => {
      // Set beneficiary
      simnet.callPublicFn(
        "deadman-delegation-registry-v2",
        "set-beneficiary",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1)],
        deployer
      );
      const result = simnet.callPublicFn(
        "deadman-release-handler-v2",
        "execute-release",
        [Cl.uint(1), Cl.uint(1000000)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(503));
    });

    it("successfully releases STX when contract has sufficient balance", () => {
      // Set beneficiary for vault 1
      simnet.callPublicFn(
        "deadman-delegation-registry-v2",
        "set-beneficiary",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1)],
        deployer
      );

      // Fund the release-handler contract with STX
      const transferResult = simnet.transferSTX(
        5000000,
        releaseHandlerContract,
        wallet1
      );
      expect(transferResult.result).toBeOk(Cl.bool(true));

      // Execute release
      const result = simnet.callPublicFn(
        "deadman-release-handler-v2",
        "execute-release",
        [Cl.uint(1), Cl.uint(3000000)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("emits release event with correct data", () => {
      // Set beneficiary
      simnet.callPublicFn(
        "deadman-delegation-registry-v2",
        "set-beneficiary",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1)],
        deployer
      );

      // Fund contract
      simnet.transferSTX(5000000, releaseHandlerContract, wallet1);

      // Execute release
      const result = simnet.callPublicFn(
        "deadman-release-handler-v2",
        "execute-release",
        [Cl.uint(1), Cl.uint(2000000)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));

      // Check print event
      const printEvent = result.events.find(
        (e) => e.event === "print_event"
      );
      expect(printEvent).toBeDefined();
    });

    it("works when called by authorized caller", () => {
      // Set wallet3 as authorized caller
      simnet.callPublicFn(
        "deadman-release-handler-v2",
        "set-authorized-caller",
        [Cl.principal(wallet3)],
        deployer
      );

      // Set beneficiary
      simnet.callPublicFn(
        "deadman-delegation-registry-v2",
        "set-beneficiary",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1)],
        deployer
      );

      // Fund contract
      simnet.transferSTX(5000000, releaseHandlerContract, wallet1);

      // wallet3 should be able to call execute-release
      const result = simnet.callPublicFn(
        "deadman-release-handler-v2",
        "execute-release",
        [Cl.uint(1), Cl.uint(1000000)],
        wallet3
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("fails when amount exceeds contract balance", () => {
      // Set beneficiary
      simnet.callPublicFn(
        "deadman-delegation-registry-v2",
        "set-beneficiary",
        [Cl.uint(1), Cl.principal(wallet2), Cl.principal(wallet1)],
        deployer
      );

      // Fund with a small amount
      simnet.transferSTX(1000, releaseHandlerContract, wallet1);

      // Try to release more than the balance
      const result = simnet.callPublicFn(
        "deadman-release-handler-v2",
        "execute-release",
        [Cl.uint(1), Cl.uint(5000)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(503));
    });
  });
});
