import { Cl } from "@stacks/transactions";
import { describe, it, expect } from "vitest";

const accounts = simnet.getAccounts();
const owner = accounts.get("wallet_1")!;
const alice = accounts.get("wallet_2")!;
const bob = accounts.get("wallet_3")!;
const carol = accounts.get("wallet_4")!;

function callPublic(fn: string, args: any[], sender: string) {
  return simnet.callPublicFn("delegation-registry", fn, args, sender);
}

function callRead(fn: string, args: any[] = [], sender: string = owner) {
  return simnet.callReadOnlyFn("delegation-registry", fn, args, sender);
}

describe("Delegation Registry Tests", () => {

  it("allows owner to set authorized caller", () => {
    const { result } = callPublic(
      "set-authorized-caller",
      [Cl.principal(alice)],
      owner
    );

    expect(result).toBeOk(Cl.principal(alice));
  });

  it("prevents non-owner from setting authorized caller", () => {
    const { result } = callPublic(
      "set-authorized-caller",
      [Cl.principal(bob)],
      alice
    );

    expect(result).toBeErr(Cl.uint(300)); // ERR-NOT-AUTHORIZED
  });

  it("sets beneficiary via authorized caller", () => {
    callPublic("set-authorized-caller", [Cl.principal(alice)], owner);

    const { result } = callPublic(
      "set-beneficiary",
      [Cl.uint(1), Cl.principal(bob), Cl.principal(owner)],
      alice
    );

    expect(result).toBeOk(Cl.principal(bob));

    const beneficiary = callRead("get-beneficiary", [Cl.uint(1)]);
    expect(beneficiary).toBeSome(Cl.principal(bob));
  });

  it("prevents self-delegation for beneficiary", () => {
    callPublic("set-authorized-caller", [Cl.principal(alice)], owner);

    const { result } = callPublic(
      "set-beneficiary",
      [Cl.uint(2), Cl.principal(owner), Cl.principal(owner)],
      alice
    );

    expect(result).toBeErr(Cl.uint(301)); // ERR-SELF-DELEGATION
  });

  it("adds cosigners and tracks count", () => {
    callPublic("set-authorized-caller", [Cl.principal(alice)], owner);

    callPublic(
      "add-cosigner",
      [Cl.uint(3), Cl.principal(bob), Cl.principal(owner), Cl.uint(5)],
      alice
    );

    callPublic(
      "add-cosigner",
      [Cl.uint(3), Cl.principal(carol), Cl.principal(owner), Cl.uint(5)],
      alice
    );

    const count = callRead("get-cosigner-count", [Cl.uint(3)]);
    expect(count).toBe(Cl.uint(2));
  });

  it("prevents adding more than max allowed cosigners", () => {
    callPublic("set-authorized-caller", [Cl.principal(alice)], owner);

    callPublic(
      "add-cosigner",
      [Cl.uint(4), Cl.principal(bob), Cl.principal(owner), Cl.uint(1)],
      alice
    );

    const { result } = callPublic(
      "add-cosigner",
      [Cl.uint(4), Cl.principal(carol), Cl.principal(owner), Cl.uint(1)],
      alice
    );

    expect(result).toBeErr(Cl.uint(302)); // ERR-TOO-MANY
  });

  it("allows cosigner to submit approval", () => {
    callPublic("set-authorized-caller", [Cl.principal(alice)], owner);

    callPublic(
      "add-cosigner",
      [Cl.uint(5), Cl.principal(bob), Cl.principal(owner), Cl.uint(5)],
      alice
    );

    const { result } = callPublic(
      "submit-approval",
      [Cl.uint(5)],
      bob
    );

    expect(result).toBeOk(Cl.uint(1));

    const approvalCount = callRead("get-approval-count", [Cl.uint(5)]);
    expect(approvalCount).toBe(Cl.uint(1));

    const hasApproved = callRead("has-approved", [
      Cl.uint(5),
      Cl.principal(bob),
    ]);

    expect(hasApproved).toBe(Cl.bool(true));
  });

  it("prevents double approval", () => {
    callPublic("set-authorized-caller", [Cl.principal(alice)], owner);

    callPublic(
      "add-cosigner",
      [Cl.uint(6), Cl.principal(bob), Cl.principal(owner), Cl.uint(5)],
      alice
    );

    callPublic("submit-approval", [Cl.uint(6)], bob);

    const { result } = callPublic("submit-approval", [Cl.uint(6)], bob);
    expect(result).toBeErr(Cl.uint(304)); // ERR-ALREADY-APPROVED
  });

  it("prevents non-cosigner from approving", () => {
    const { result } = callPublic(
      "submit-approval",
      [Cl.uint(99)],
      carol
    );

    expect(result).toBeErr(Cl.uint(305)); // ERR-NOT-COSIGNER
  });

});
