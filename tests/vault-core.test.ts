import { Cl } from "@stacks/transactions";
import { describe, it, expect } from "vitest";

const accounts = simnet.getAccounts();
const owner = accounts.get("wallet_1")!;
const alice = accounts.get("wallet_2")!;
const bob = accounts.get("wallet_3")!;
const carol = accounts.get("wallet_4")!;

function callPublic(contract: string, fn: string, args: any[], sender: string) {
  return simnet.callPublicFn(contract, fn, args, sender);
}

function callRead(contract: string, fn: string, args: any[] = [], sender: string = owner) {
  return simnet.callReadOnlyFn(contract, fn, args, sender);
}

describe("Vault Core Tests", () => {

  it("creates a block-height vault successfully", () => {
    const targetBlock = simnet.blockHeight + 200;

    const { result } = callPublic(
      "vault-core",
      "create-vault",
      [
        Cl.uint(1000),
        Cl.uint(1), // CONDITION-BLOCK-HEIGHT
        Cl.uint(targetBlock),
        Cl.uint(0),
        Cl.uint(0),
        Cl.principal(bob)
      ],
      owner
    );

    expect(result).toBeOk(Cl.uint(1));

    const vault = callRead("vault-core", "get-vault", [Cl.uint(1)]);
    expect(vault).toBeSome();
  });

  it("rejects zero deposit", () => {
    const { result } = callPublic(
      "vault-core",
      "create-vault",
      [
        Cl.uint(0),
        Cl.uint(1),
        Cl.uint(simnet.blockHeight + 200),
        Cl.uint(0),
        Cl.uint(0),
        Cl.principal(bob)
      ],
      owner
    );

    expect(result).toBeErr(Cl.uint(608)); // ERR-ZERO-DEPOSIT
  });

  it("allows adding cosigners before release", () => {
    callPublic(
      "vault-core",
      "create-vault",
      [
        Cl.uint(1000),
        Cl.uint(3), // threshold condition
        Cl.uint(0),
        Cl.uint(0),
        Cl.uint(1),
        Cl.principal(bob)
      ],
      owner
    );

    const { result } = callPublic(
      "vault-core",
      "add-cosigner",
      [Cl.uint(2), Cl.principal(alice)],
      owner
    );

    expect(result).toBeOk();
  });

  it("allows cosigner approval submission", () => {
    callPublic("vault-core", "submit-approval", [Cl.uint(2)], alice);

    const approvalCount = callRead(
      "delegation-registry",
      "get-approval-count",
      [Cl.uint(2)]
    );

    expect(approvalCount).toBe(Cl.uint(1));
  });

  it("releases vault when threshold met", () => {
    const initialBalance = simnet.getAssetsMap().stx[bob] ?? 0;

    const { result } = callPublic(
      "vault-core",
      "trigger-release",
      [Cl.uint(2)],
      owner
    );

    expect(result).toBeOk(Cl.bool(true));

    const finalBalance = simnet.getAssetsMap().stx[bob] ?? 0;
    expect(finalBalance).toBeGreaterThan(initialBalance);
  });

  it("prevents double release", () => {
    const { result } = callPublic(
      "vault-core",
      "trigger-release",
      [Cl.uint(2)],
      owner
    );

    expect(result).toBeErr(Cl.uint(605)); // ERR-ALREADY-RELEASED
  });

  it("allows owner to cancel vault before release", () => {
    callPublic(
      "vault-core",
      "create-vault",
      [
        Cl.uint(500),
        Cl.uint(1),
        Cl.uint(simnet.blockHeight + 300),
        Cl.uint(0),
        Cl.uint(0),
        Cl.principal(carol)
      ],
      owner
    );

    const { result } = callPublic(
      "vault-core",
      "cancel-vault",
      [Cl.uint(3)],
      owner
    );

    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents non-owner from cancelling vault", () => {
    callPublic(
      "vault-core",
      "create-vault",
      [
        Cl.uint(500),
        Cl.uint(1),
        Cl.uint(simnet.blockHeight + 300),
        Cl.uint(0),
        Cl.uint(0),
        Cl.principal(carol)
      ],
      owner
    );

    const { result } = callPublic(
      "vault-core",
      "cancel-vault",
      [Cl.uint(4)],
      alice
    );

    expect(result).toBeErr(Cl.uint(604)); // ERR-NOT-VAULT-OWNER
  });

});
