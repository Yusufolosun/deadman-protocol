import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

const ROLE_ADMIN = 1;
const ROLE_OPERATOR = 2;
const ROLE_GUARDIAN = 3;

describe("deadman-access-control", () => {
  describe("grant-role", () => {
    it("allows deployer to grant a role", () => {
      const result = simnet.callPublicFn(
        "deadman-access-control",
        "grant-role",
        [Cl.principal(wallet1), Cl.uint(ROLE_OPERATOR)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-deployer granting roles", () => {
      const result = simnet.callPublicFn(
        "deadman-access-control",
        "grant-role",
        [Cl.principal(wallet2), Cl.uint(ROLE_OPERATOR)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(1200));
    });

    it("rejects invalid role numbers", () => {
      const result = simnet.callPublicFn(
        "deadman-access-control",
        "grant-role",
        [Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(1201));
    });

    it("allows admin-role holders to grant roles", () => {
      simnet.callPublicFn(
        "deadman-access-control",
        "grant-role",
        [Cl.principal(wallet1), Cl.uint(ROLE_ADMIN)],
        deployer
      );
      const result = simnet.callPublicFn(
        "deadman-access-control",
        "grant-role",
        [Cl.principal(wallet2), Cl.uint(ROLE_OPERATOR)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });
  });

  describe("revoke-role", () => {
    it("allows deployer to revoke a role", () => {
      simnet.callPublicFn(
        "deadman-access-control",
        "grant-role",
        [Cl.principal(wallet1), Cl.uint(ROLE_OPERATOR)],
        deployer
      );
      const result = simnet.callPublicFn(
        "deadman-access-control",
        "revoke-role",
        [Cl.principal(wallet1), Cl.uint(ROLE_OPERATOR)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents deployer from revoking own admin role", () => {
      const result = simnet.callPublicFn(
        "deadman-access-control",
        "revoke-role",
        [Cl.principal(deployer), Cl.uint(ROLE_ADMIN)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(1202));
    });
  });

  describe("has-role / role queries", () => {
    it("deployer implicitly has all roles", () => {
      const admin = simnet.callReadOnlyFn("deadman-access-control", "is-admin", [Cl.principal(deployer)], deployer);
      const op = simnet.callReadOnlyFn("deadman-access-control", "is-operator", [Cl.principal(deployer)], deployer);
      const guard = simnet.callReadOnlyFn("deadman-access-control", "is-guardian", [Cl.principal(deployer)], deployer);
      expect(admin.result).toBeBool(true);
      expect(op.result).toBeBool(true);
      expect(guard.result).toBeBool(true);
    });

    it("non-granted principal has no roles", () => {
      const admin = simnet.callReadOnlyFn("deadman-access-control", "is-admin", [Cl.principal(wallet2)], deployer);
      const op = simnet.callReadOnlyFn("deadman-access-control", "is-operator", [Cl.principal(wallet2)], deployer);
      expect(admin.result).toBeBool(false);
      expect(op.result).toBeBool(false);
    });

    it("granted operator has operator role only", () => {
      simnet.callPublicFn(
        "deadman-access-control",
        "grant-role",
        [Cl.principal(wallet1), Cl.uint(ROLE_OPERATOR)],
        deployer
      );
      const op = simnet.callReadOnlyFn("deadman-access-control", "is-operator", [Cl.principal(wallet1)], deployer);
      const admin = simnet.callReadOnlyFn("deadman-access-control", "is-admin", [Cl.principal(wallet1)], deployer);
      expect(op.result).toBeBool(true);
      expect(admin.result).toBeBool(false);
    });

    it("role is gone after revocation", () => {
      simnet.callPublicFn("deadman-access-control", "grant-role", [Cl.principal(wallet1), Cl.uint(ROLE_GUARDIAN)], deployer);
      simnet.callPublicFn("deadman-access-control", "revoke-role", [Cl.principal(wallet1), Cl.uint(ROLE_GUARDIAN)], deployer);
      const result = simnet.callReadOnlyFn("deadman-access-control", "is-guardian", [Cl.principal(wallet1)], deployer);
      expect(result.result).toBeBool(false);
    });
  });
});
