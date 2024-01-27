import { expect, it } from "bun:test";
import Permissions from "@/Utils/Classes/BitFields/Permissions.ts";

it("should create a new Permissions instance", () => {
	const perms = new Permissions([]);

	expect(perms).toBeInstanceOf(Permissions);
});

it("should add Administrator permissions", () => {
	const perms = new Permissions([]);

	perms.add(["Administrator"]);

	expect(perms.bits).toEqual([[1n << 0n, -1n]]);
});

it("should add Guild permissions", () => {
	const perms = new Permissions([]);

	perms.add(["ServerName"]);

	expect(perms.bits).toEqual([[1n << 1n, 1n]]);
});

it("Should allow for some permissions to be valid", () => {
	const perms = new Permissions([[2n, 1n]]);

	expect(perms.has(["ServerName", "BanMembers"], "some")).toBe(true);
	expect(perms.has(["ServerName", "AddBots"], "some")).toBe(true);
});

it("Should require all permissions to be valid", () => {
	const perms = new Permissions([[2n, 1n]]);

	expect(perms.has(["ServerName", "BanMembers"], "all")).toBe(false);
	expect(perms.has(["ServerName", "AddBots"], "all")).toBe(false);
	expect(perms.has(["ServerName", "AddBots"], "all")).toBe(false);
	expect(perms.has(["ServerName"], "all")).toBe(true);
});
