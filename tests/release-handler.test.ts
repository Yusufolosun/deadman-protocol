import { Cl } from "@stacks/transactions";
import { describe, it, expect } from "vitest";

const accounts = simnet.getAccounts();
const owner = accounts.get("wallet_1")!;
const vaultCore = accounts.get("wallet_2")!;
const beneficiary = accounts.get("wallet_3")!;
const attacker = accounts.get("wallet_4")!;

function callPublic(fn: string, args: any[], sender: string) {
  return simnet.callPublicFn("release-handler", fn, args, sender);
}

function callRead(contract: string, fn: string, args: any[] = [], sender: string = owner) {
  return simnet.callReadOnlyFn(contract, fn, args, sender);
}

describe("Release Handler Tests", () => {

  it("allows owner to set authorized caller", () => {
    const { result } = callPublic(
      "set-authorized-caller",
      [Cl.principal(vaultCore)],
      owner
    );

    expect(result).toBeOk(Cl.principal(vaultCore));
  });

  it("prevents non-owner from setting authorized caller", () => {
    const { result } = callPublic(
      "set-authorized-caller",
      [Cl.principal(attacker)],
      attacker
    );

    expect(result).toBeErr(Cl.uint(500)); // ERR-NOT-AUTHORIZED
  });

  it("fails if no beneficiary is set", () => {
    callPublic("set-authorized-caller", [Cl.principal(vaultCore)], owner);

    const { result } = callPublic(
      "execute-release",
      [Cl.uint(1), Cl.uint(1000)],
      vaultCore
    );

    expect(result).toBeErr(Cl.uint(501)); // ERR-NO-BENEFICIARY
  });

  it("fails if called by unauthorized principal", () => {
    const { result } = callPublic(
      "execute-release",
      [Cl.uint(1), Cl.uint(1000)],
      attacker
    );

    expect(result).toBeErr(Cl.uint(500)); // ERR-NOT-AUTHORIZED
  });

  it("fails if amount is zero", () => {
    callPublic("set-authorized-caller", [Cl.principal(vaultCore)], owner);

    // Mock beneficiary in delegation-registry
    simnet.callPublicFn(
      "delegation-registry",
      "set-beneficiary",
      [Cl.uint(2), Cl.principal(beneficiary), Cl.principal(owner)],
      owner
    );

    const { result } = callPublic(
      "execute-release",
      [Cl.uint(2), Cl.uint(0)],
      vaultCore
    );

    expect(result).toBeErr(Cl.uint(502)); // ERR-ZERO-AMOUNT
  });

  it("successfully transfers STX and emits event", () => {
    callPublic("set-authorized-caller", [Cl.principal(vaultCore)], owner);

    // Set beneficiary
    simnet.callPublicFn(
      "delegation-registry",
      "set-beneficiary",
      [Cl.uint(3), Cl.principal(beneficiary), Cl.principal(owner)],
      owner
    );

    const initialBalance = simnet.getAssetsMap().stx[beneficiary] ?? 0;

    const { result, events } = callPublic(
      "execute-release",
      [Cl.uint(3), Cl.uint(1000)],
      vaultCore
    );

    expect(result).toBeOk(Cl.bool(true));

    const finalBalance = simnet.getAssetsMap().stx[beneficiary] ?? 0;
    expect(finalBalance).toBe(initialBalance + 1000);

    // Verify event emitted
    const releaseEvent = events.find(e =>
      JSON.stringify(e).includes("vault-released")
    );

    expect(releaseEvent).toBeTruthy();
  });

});
