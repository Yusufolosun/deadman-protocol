import { Cl } from "@stacks/transactions";
import { describe, it, expect } from "vitest";

const accounts = simnet.getAccounts();
const owner = accounts.get("wallet_1")!; // deployer
const alice = accounts.get("wallet_2")!; // non-owner

// Helpers
function callPublic(fn: string, args: any[], sender: string) {
  return simnet.callPublicFn("admin-config", fn, args, sender);
}

function callRead(fn: string, args: any[] = [], sender: string = owner) {
  return simnet.callReadOnlyFn("admin-config", fn, args, sender);
}

describe("Admin Config Tests", () => {

  it("returns default config values", () => {
    const config = callRead("get-config");

    expect(config).toEqual(
      Cl.tuple({
        "min-lock-blocks": Cl.uint(144),
        "max-cosigners": Cl.uint(5),
        "max-beneficiaries": Cl.uint(5),
        paused: Cl.bool(false),
      })
    );
  });

  it("allows owner to update min-lock-blocks", () => {
    const { result } = callPublic(
      "set-min-lock-blocks",
      [Cl.uint(200)],
      owner
    );

    expect(result).toBeOk(Cl.uint(200));

    const updated = callRead("get-min-lock-blocks");
    expect(updated).toBe(Cl.uint(200));
  });

  it("prevents non-owner from updating config", () => {
    const { result } = callPublic(
      "set-min-lock-blocks",
      [Cl.uint(300)],
      alice
    );

    expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-OWNER
  });

  it("validates min-lock-blocks must be > 0", () => {
    const { result } = callPublic(
      "set-min-lock-blocks",
      [Cl.uint(0)],
      owner
    );

    expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-VALUE
  });

  it("allows owner to update max-cosigners within bounds", () => {
    const { result } = callPublic(
      "set-max-cosigners",
      [Cl.uint(8)],
      owner
    );

    expect(result).toBeOk(Cl.uint(8));

    const updated = callRead("get-max-cosigners");
    expect(updated).toBe(Cl.uint(8));
  });

  it("rejects max-cosigners above limit", () => {
    const { result } = callPublic(
      "set-max-cosigners",
      [Cl.uint(11)],
      owner
    );

    expect(result).toBeErr(Cl.uint(101)); // ERR-INVALID-VALUE
  });

  it("allows owner to toggle pause state", () => {
    const pauseRes = callPublic(
      "set-paused",
      [Cl.bool(true)],
      owner
    );

    expect(pauseRes.result).toBeOk(Cl.bool(true));

    const paused = callRead("is-paused");
    expect(paused).toBe(Cl.bool(true));
  });

});
