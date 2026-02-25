import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("deadman-notification-logger", () => {
  describe("log-event", () => {
    it("allows deployer to log an event", () => {
      const result = simnet.callPublicFn(
        "deadman-notification-logger",
        "log-event",
        [
          Cl.stringAscii("vault-created"),
          Cl.uint(1),
          Cl.principal(deployer),
          Cl.uint(1000000),
        ],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(1));
    });

    it("rejects unauthorized callers", () => {
      const result = simnet.callPublicFn(
        "deadman-notification-logger",
        "log-event",
        [
          Cl.stringAscii("vault-created"),
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.uint(500000),
        ],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(900));
    });

    it("increments event IDs sequentially", () => {
      const r1 = simnet.callPublicFn(
        "deadman-notification-logger",
        "log-event",
        [Cl.stringAscii("event-a"), Cl.uint(1), Cl.principal(deployer), Cl.uint(0)],
        deployer
      );
      const r2 = simnet.callPublicFn(
        "deadman-notification-logger",
        "log-event",
        [Cl.stringAscii("event-b"), Cl.uint(2), Cl.principal(deployer), Cl.uint(0)],
        deployer
      );
      expect(r1.result).toBeOk(Cl.uint(1));
      expect(r2.result).toBeOk(Cl.uint(2));
    });
  });

  describe("get-event", () => {
    it("returns none for non-existent event", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-notification-logger",
        "get-event",
        [Cl.uint(999)],
        deployer
      );
      expect(result.result).toBeNone();
    });

    it("returns event data after logging", () => {
      simnet.callPublicFn(
        "deadman-notification-logger",
        "log-event",
        [Cl.stringAscii("vault-released"), Cl.uint(5), Cl.principal(wallet1), Cl.uint(2000000)],
        deployer
      );
      const result = simnet.callReadOnlyFn(
        "deadman-notification-logger",
        "get-event",
        [Cl.uint(1)],
        deployer
      );
      const event = (result.result as any).value.value;
      expect(event["event-type"]).toStrictEqual(Cl.stringAscii("vault-released"));
      expect(event["vault-id"]).toStrictEqual(Cl.uint(5));
      expect(event.actor).toStrictEqual(Cl.principal(wallet1));
      expect(event.data).toStrictEqual(Cl.uint(2000000));
    });
  });

  describe("get-next-event-id", () => {
    it("starts at 1", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-notification-logger",
        "get-next-event-id",
        [],
        deployer
      );
      expect(result.result).toBeUint(1);
    });
  });

  describe("set-authorized-caller", () => {
    it("allows deployer to set authorized caller", () => {
      const result = simnet.callPublicFn(
        "deadman-notification-logger",
        "set-authorized-caller",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-deployer", () => {
      const result = simnet.callPublicFn(
        "deadman-notification-logger",
        "set-authorized-caller",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(900));
    });
  });
});
