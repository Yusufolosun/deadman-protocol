import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const wallet4 = accounts.get("wallet_4")!;
const wallet5 = accounts.get("wallet_5")!;

const vaultCorePrincipal = `${deployer}.deadman-vault-core`;

// Set vault-core as the authorized caller for delegation-registry and
// release-handler so that cross-contract calls pass authorization
function setupAuthorizedCallers() {
  simnet.callPublicFn(
    "delegation-registry",
    "set-authorized-caller",
    [Cl.principal(vaultCorePrincipal)],
    deployer
  );
  simnet.callPublicFn(
    "release-handler",
    "set-authorized-caller",
    [Cl.principal(vaultCorePrincipal)],
    deployer
  );
}

// Helper: create a condition-type-1 (block-height) vault with sensible defaults
function createBlockHeightVault(
  owner: string,
  amount: number,
  targetBlock: number,
  beneficiary: string
) {
  return simnet.callPublicFn(
    "deadman-vault-core",
    "create-vault",
    [
      Cl.uint(amount),
      Cl.uint(1),
      Cl.uint(targetBlock),
      Cl.uint(0),
      Cl.uint(0),
      Cl.principal(beneficiary),
    ],
    owner
  );
}

// Helper: create a condition-type-2 (inactivity) vault
function createInactivityVault(
  owner: string,
  amount: number,
  inactivityBlocks: number,
  beneficiary: string
) {
  return simnet.callPublicFn(
    "deadman-vault-core",
    "create-vault",
    [
      Cl.uint(amount),
      Cl.uint(2),
      Cl.uint(0),
      Cl.uint(inactivityBlocks),
      Cl.uint(0),
      Cl.principal(beneficiary),
    ],
    owner
  );
}

// Helper: create a condition-type-3 (threshold/cosigner) vault
function createThresholdVault(
  owner: string,
  amount: number,
  threshold: number,
  beneficiary: string
) {
  return simnet.callPublicFn(
    "deadman-vault-core",
    "create-vault",
    [
      Cl.uint(amount),
      Cl.uint(3),
      Cl.uint(0),
      Cl.uint(0),
      Cl.uint(threshold),
      Cl.principal(beneficiary),
    ],
    owner
  );
}

describe("deadman-vault-core", () => {
  beforeEach(() => {
    setupAuthorizedCallers();
  });

  describe("create-vault", () => {
    it("creates a block-height condition vault", () => {
      const targetBlock = simnet.blockHeight + 200;
      const result = createBlockHeightVault(
        wallet1,
        1000000,
        targetBlock,
        wallet2
      );
      expect(result.result).toBeOk(Cl.uint(1));
    });

    it("increments vault id", () => {
      const targetBlock = simnet.blockHeight + 200;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);
      const result = createBlockHeightVault(
        wallet1,
        2000000,
        simnet.blockHeight + 200,
        wallet3
      );
      expect(result.result).toBeOk(Cl.uint(2));
    });

    it("creates an inactivity condition vault", () => {
      const result = createInactivityVault(wallet1, 1000000, 200, wallet2);
      expect(result.result).toBeOk(Cl.uint(1));
    });

    it("creates a threshold condition vault", () => {
      const result = createThresholdVault(wallet1, 1000000, 2, wallet2);
      expect(result.result).toBeOk(Cl.uint(1));
    });

    it("rejects zero deposit", () => {
      const targetBlock = simnet.blockHeight + 200;
      const result = createBlockHeightVault(wallet1, 0, targetBlock, wallet2);
      expect(result.result).toBeErr(Cl.uint(608));
    });

    it("rejects invalid condition type u0", () => {
      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "create-vault",
        [
          Cl.uint(1000000),
          Cl.uint(0),
          Cl.uint(1000),
          Cl.uint(0),
          Cl.uint(0),
          Cl.principal(wallet2),
        ],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(602));
    });

    it("rejects invalid condition type u4", () => {
      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "create-vault",
        [
          Cl.uint(1000000),
          Cl.uint(4),
          Cl.uint(1000),
          Cl.uint(0),
          Cl.uint(0),
          Cl.principal(wallet2),
        ],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(602));
    });

    it("rejects block-height vault with target below min-lock", () => {
      const targetBlock = simnet.blockHeight + 50;
      const result = createBlockHeightVault(
        wallet1,
        1000000,
        targetBlock,
        wallet2
      );
      expect(result.result).toBeErr(Cl.uint(607));
    });

    it("rejects inactivity vault with blocks below min-lock", () => {
      const result = createInactivityVault(wallet1, 1000000, 50, wallet2);
      expect(result.result).toBeErr(Cl.uint(607));
    });

    it("rejects threshold vault with zero threshold", () => {
      const result = createThresholdVault(wallet1, 1000000, 0, wallet2);
      expect(result.result).toBeErr(Cl.uint(607));
    });

    it("rejects self as beneficiary", () => {
      const targetBlock = simnet.blockHeight + 200;
      const result = createBlockHeightVault(
        wallet1,
        1000000,
        targetBlock,
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(301));
    });

    it("rejects when protocol is paused", () => {
      simnet.callPublicFn(
        "admin-config",
        "set-paused",
        [Cl.bool(true)],
        deployer
      );
      const targetBlock = simnet.blockHeight + 200;
      const result = createBlockHeightVault(
        wallet1,
        1000000,
        targetBlock,
        wallet2
      );
      expect(result.result).toBeErr(Cl.uint(601));
    });

    it("emits vault-created print event", () => {
      const targetBlock = simnet.blockHeight + 200;
      const result = createBlockHeightVault(
        wallet1,
        1000000,
        targetBlock,
        wallet2
      );
      expect(result.result).toBeOk(Cl.uint(1));
      const printEvent = result.events.find(
        (e) => e.event === "print_event"
      );
      expect(printEvent).toBeDefined();
    });
  });

  describe("get-vault", () => {
    it("returns none for non-existent vault", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-vault-core",
        "get-vault",
        [Cl.uint(999)],
        deployer
      );
      expect(result.result).toBeNone();
    });

    it("returns vault data after creation", () => {
      const targetBlock = simnet.blockHeight + 200;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);
      const result = simnet.callReadOnlyFn(
        "deadman-vault-core",
        "get-vault",
        [Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeSome(
        Cl.tuple({
          owner: Cl.principal(wallet1),
          amount: Cl.uint(1000000),
          "condition-type": Cl.uint(1),
          "target-block": Cl.uint(targetBlock),
          "inactivity-blocks": Cl.uint(0),
          "required-threshold": Cl.uint(0),
          released: Cl.bool(false),
          "created-at": Cl.uint(simnet.blockHeight),
        })
      );
    });
  });

  describe("get-next-vault-id", () => {
    it("starts at 1", () => {
      const result = simnet.callReadOnlyFn(
        "deadman-vault-core",
        "get-next-vault-id",
        [],
        deployer
      );
      expect(result.result).toBeUint(1);
    });

    it("increments after vault creation", () => {
      const targetBlock = simnet.blockHeight + 200;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);

      const result = simnet.callReadOnlyFn(
        "deadman-vault-core",
        "get-next-vault-id",
        [],
        deployer
      );
      expect(result.result).toBeUint(2);
    });
  });

  describe("add-cosigner", () => {
    it("allows vault owner to add a cosigner", () => {
      const targetBlock = simnet.blockHeight + 200;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);

      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet3)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-owner adding cosigner", () => {
      const targetBlock = simnet.blockHeight + 200;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);

      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet3)],
        wallet2
      );
      expect(result.result).toBeErr(Cl.uint(604));
    });

    it("rejects cosigner for non-existent vault", () => {
      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "add-cosigner",
        [Cl.uint(999), Cl.principal(wallet3)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(603));
    });

    it("rejects owner as cosigner (self-delegation)", () => {
      const targetBlock = simnet.blockHeight + 200;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);

      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet1)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(301));
    });
  });

  describe("submit-approval", () => {
    it("allows cosigner to submit approval", () => {
      const targetBlock = simnet.blockHeight + 200;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);
      simnet.callPublicFn(
        "deadman-vault-core",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet3)],
        wallet1
      );
      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "submit-approval",
        [Cl.uint(1)],
        wallet3
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects approval for non-existent vault", () => {
      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "submit-approval",
        [Cl.uint(999)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(603));
    });

    it("rejects non-cosigner approval", () => {
      const targetBlock = simnet.blockHeight + 200;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);

      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "submit-approval",
        [Cl.uint(1)],
        wallet4
      );
      expect(result.result).toBeErr(Cl.uint(305));
    });
  });

  describe("cancel-vault", () => {
    it("allows owner to cancel a vault", () => {
      const targetBlock = simnet.blockHeight + 200;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);

      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "cancel-vault",
        [Cl.uint(1)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-owner cancellation", () => {
      const targetBlock = simnet.blockHeight + 200;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);

      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "cancel-vault",
        [Cl.uint(1)],
        wallet2
      );
      expect(result.result).toBeErr(Cl.uint(604));
    });

    it("rejects cancelling non-existent vault", () => {
      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "cancel-vault",
        [Cl.uint(999)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(603));
    });

    it("rejects cancelling already-released vault", () => {
      const targetBlock = simnet.blockHeight + 200;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);

      simnet.callPublicFn(
        "deadman-vault-core",
        "cancel-vault",
        [Cl.uint(1)],
        wallet1
      );

      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "cancel-vault",
        [Cl.uint(1)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(605));
    });

    it("returns STX to vault owner", () => {
      const amount = 1000000;
      const targetBlock = simnet.blockHeight + 200;

      const assetsBefore = simnet.getAssetsMap();
      const stxBefore =
        assetsBefore.get("STX")?.get(wallet1) ?? BigInt(0);

      createBlockHeightVault(wallet1, amount, targetBlock, wallet2);

      const assetsAfterDeposit = simnet.getAssetsMap();
      const stxAfterDeposit =
        assetsAfterDeposit.get("STX")?.get(wallet1) ?? BigInt(0);
      expect(stxAfterDeposit).toBeLessThan(stxBefore);

      simnet.callPublicFn(
        "deadman-vault-core",
        "cancel-vault",
        [Cl.uint(1)],
        wallet1
      );

      const assetsAfterCancel = simnet.getAssetsMap();
      const stxAfterCancel =
        assetsAfterCancel.get("STX")?.get(wallet1) ?? BigInt(0);
      expect(stxAfterCancel).toEqual(stxBefore);
    });

    it("emits vault-cancelled event", () => {
      const targetBlock = simnet.blockHeight + 200;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);

      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "cancel-vault",
        [Cl.uint(1)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));
      const printEvent = result.events.find(
        (e) => e.event === "print_event"
      );
      expect(printEvent).toBeDefined();
    });
  });

  describe("trigger-release", () => {
    it("rejects release for non-existent vault", () => {
      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "trigger-release",
        [Cl.uint(999)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(603));
    });

    it("rejects release when already released", () => {
      const targetBlock = simnet.blockHeight + 200;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);

      simnet.callPublicFn(
        "deadman-vault-core",
        "cancel-vault",
        [Cl.uint(1)],
        wallet1
      );

      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "trigger-release",
        [Cl.uint(1)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(605));
    });

    it("rejects release when block-height condition not met", () => {
      const targetBlock = simnet.blockHeight + 500;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);

      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "trigger-release",
        [Cl.uint(1)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(606));
    });

    it("rejects release when threshold condition not met", () => {
      createThresholdVault(wallet1, 1000000, 2, wallet2);

      simnet.callPublicFn(
        "deadman-vault-core",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet3)],
        wallet1
      );
      simnet.callPublicFn(
        "deadman-vault-core",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet4)],
        wallet1
      );

      // Only 1 approval, need 2
      simnet.callPublicFn(
        "deadman-vault-core",
        "submit-approval",
        [Cl.uint(1)],
        wallet3
      );

      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "trigger-release",
        [Cl.uint(1)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(606));
    });

    it("succeeds with block-height condition when target reached", () => {
      const targetBlock = simnet.blockHeight + 150;
      createBlockHeightVault(wallet1, 1000000, targetBlock, wallet2);

      // Fund the release-handler contract so the transfer succeeds
      const releaseHandlerContract = `${deployer}.release-handler`;
      simnet.transferSTX(1000000, releaseHandlerContract, wallet1);

      // Mine blocks until target is reached
      const blocksNeeded = targetBlock - simnet.blockHeight + 1;
      simnet.mineEmptyBlocks(blocksNeeded);

      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "trigger-release",
        [Cl.uint(1)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("succeeds with threshold condition when approvals met", () => {
      createThresholdVault(wallet1, 1000000, 2, wallet2);

      // Fund release-handler
      const releaseHandlerContract = `${deployer}.release-handler`;
      simnet.transferSTX(1000000, releaseHandlerContract, wallet1);

      // Add 2 cosigners and get 2 approvals
      simnet.callPublicFn(
        "deadman-vault-core",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet3)],
        wallet1
      );
      simnet.callPublicFn(
        "deadman-vault-core",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet4)],
        wallet1
      );
      simnet.callPublicFn(
        "deadman-vault-core",
        "submit-approval",
        [Cl.uint(1)],
        wallet3
      );
      simnet.callPublicFn(
        "deadman-vault-core",
        "submit-approval",
        [Cl.uint(1)],
        wallet4
      );

      const result = simnet.callPublicFn(
        "deadman-vault-core",
        "trigger-release",
        [Cl.uint(1)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("marks vault as released after successful trigger", () => {
      createThresholdVault(wallet1, 1000000, 1, wallet2);

      // Fund release-handler
      const releaseHandlerContract = `${deployer}.release-handler`;
      simnet.transferSTX(1000000, releaseHandlerContract, wallet1);

      // Add cosigner and approve
      simnet.callPublicFn(
        "deadman-vault-core",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet3)],
        wallet1
      );
      simnet.callPublicFn(
        "deadman-vault-core",
        "submit-approval",
        [Cl.uint(1)],
        wallet3
      );

      simnet.callPublicFn(
        "deadman-vault-core",
        "trigger-release",
        [Cl.uint(1)],
        wallet1
      );

      // Verify vault is marked as released
      const vault = simnet.callReadOnlyFn(
        "deadman-vault-core",
        "get-vault",
        [Cl.uint(1)],
        deployer
      );
      // The vault should exist and be marked released
      const vaultData = vault.result as any;
      expect(vaultData.type).toBe("some");
      expect(vaultData.value.value.released.type).toBe("true");
    });

    it("prevents double release", () => {
      createThresholdVault(wallet1, 1000000, 1, wallet2);

      // Fund release-handler with enough for one release
      const releaseHandlerContract = `${deployer}.release-handler`;
      simnet.transferSTX(2000000, releaseHandlerContract, wallet1);

      // Add cosigner and approve
      simnet.callPublicFn(
        "deadman-vault-core",
        "add-cosigner",
        [Cl.uint(1), Cl.principal(wallet3)],
        wallet1
      );
      simnet.callPublicFn(
        "deadman-vault-core",
        "submit-approval",
        [Cl.uint(1)],
        wallet3
      );

      // First release succeeds
      const first = simnet.callPublicFn(
        "deadman-vault-core",
        "trigger-release",
        [Cl.uint(1)],
        wallet1
      );
      expect(first.result).toBeOk(Cl.bool(true));

      // Second release fails
      const second = simnet.callPublicFn(
        "deadman-vault-core",
        "trigger-release",
        [Cl.uint(1)],
        wallet1
      );
      expect(second.result).toBeErr(Cl.uint(605));
    });
  });
});
