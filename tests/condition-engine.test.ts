import { Cl } from "@stacks/transactions";
import { describe, it, expect } from "vitest";

const accounts = simnet.getAccounts();
const alice = accounts.get("wallet_1")!;

// Helpers
function callRead(fn: string, args: any[]) {
  return simnet.callReadOnlyFn("condition-engine", fn, args, alice);
}

function ping(user: string) {
  return simnet.callPublicFn("activity-tracker", "ping", [], user);
}

describe("Condition Engine Tests", () => {

  it("check-block-height returns true when target reached", () => {
    const current = simnet.blockHeight;

    const result = callRead("check-block-height", [Cl.uint(current)]);
    expect(result).toBe(Cl.bool(true));
  });

  it("check-block-height returns false when target not reached", () => {
    const current = simnet.blockHeight;

    const result = callRead("check-block-height", [Cl.uint(current + 100)]);
    expect(result).toBe(Cl.bool(false));
  });

  it("check-threshold works correctly", () => {
    const trueRes = callRead("check-threshold", [
      Cl.uint(5),
      Cl.uint(3),
    ]);
    expect(trueRes).toBe(Cl.bool(true));

    const falseRes = callRead("check-threshold", [
      Cl.uint(2),
      Cl.uint(5),
    ]);
    expect(falseRes).toBe(Cl.bool(false));
  });

  it("check-inactivity returns false immediately after ping", () => {
    ping(alice);

    const result = callRead("check-inactivity", [
      Cl.principal(alice),
      Cl.uint(10),
    ]);

    expect(result).toBe(Cl.bool(false));
  });

  it("check-inactivity returns true after enough blocks", () => {
    ping(alice);
    simnet.mineEmptyBlocks(20);

    const result = callRead("check-inactivity", [
      Cl.principal(alice),
      Cl.uint(10),
    ]);

    expect(result).toBe(Cl.bool(true));
  });

  it("evaluate-condition handles block-height type", () => {
    const current = simnet.blockHeight;

    const result = callRead("evaluate-condition", [
      Cl.uint(1), // CONDITION-BLOCK-HEIGHT
      Cl.principal(alice),
      Cl.uint(current),
      Cl.uint(0),
      Cl.uint(0),
      Cl.uint(0),
    ]);

    expect(result).toBeOk(Cl.bool(true));
  });

  it("evaluate-condition handles threshold type", () => {
    const result = callRead("evaluate-condition", [
      Cl.uint(3), // CONDITION-THRESHOLD
      Cl.principal(alice),
      Cl.uint(0),
      Cl.uint(0),
      Cl.uint(5),
      Cl.uint(3),
    ]);

    expect(result).toBeOk(Cl.bool(true));
  });

  it("evaluate-condition returns error for unknown type", () => {
    const result = callRead("evaluate-condition", [
      Cl.uint(99),
      Cl.principal(alice),
      Cl.uint(0),
      Cl.uint(0),
      Cl.uint(0),
      Cl.uint(0),
    ]);

    expect(result).toBeErr(Cl.uint(400));
  });

});
