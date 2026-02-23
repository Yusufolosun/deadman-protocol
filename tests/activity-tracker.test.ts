import { Cl } from "@stacks/transactions";
import { describe, it, expect } from "vitest";

const accounts = simnet.getAccounts();
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;

// Helper to call ping
function ping(user: string) {
  return simnet.callPublicFn(
    "activity-tracker",
    "ping",
    [],
    user
  );
}

// Helper to get last active block
function getLastActive(user: string) {
  return simnet.callReadOnlyFn(
    "activity-tracker",
    "get-last-active",
    [Cl.principal(user)],
    user
  );
}

// Helper to check inactivity
function isInactive(user: string, blocks: number) {
  return simnet.callReadOnlyFn(
    "activity-tracker",
    "is-inactive",
    [Cl.principal(user), Cl.uint(blocks)],
    user
  );
}

describe("Activity Tracker Tests", () => {

  it("records activity when ping is called", () => {
    const currentBlock = simnet.blockHeight;

    const { result } = ping(alice);
    expect(result).toBeOk(Cl.uint(currentBlock));

    const lastActive = getLastActive(alice);
    expect(lastActive).toBeSome(Cl.uint(currentBlock));
  });

  it("returns none for users who never pinged", () => {
    const lastActive = getLastActive(bob);
    expect(lastActive).toBeNone();
  });

  it("correctly detects inactivity", () => {
    // Alice pings at current block
    ping(alice);

    // Immediately after ping → should NOT be inactive for 10 blocks
    const inactiveEarly = isInactive(alice, 10);
    expect(inactiveEarly).toBe(Cl.bool(false));

    // Mine 15 blocks
    simnet.mineEmptyBlocks(15);

    const inactiveLater = isInactive(alice, 10);
    expect(inactiveLater).toBe(Cl.bool(true));
  });

  it("treats never-pinged users as inactive from block 0", () => {
    // Mine some blocks to move height forward
    simnet.mineEmptyBlocks(20);

    const inactive = isInactive(bob, 10);
    expect(inactive).toBe(Cl.bool(true));
  });

});
