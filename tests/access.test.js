import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ALL_PERMISSIONS,
  canGrant,
  normalizeProfile,
  resolveAccess,
  togglePermission,
} from "../src/admin/permissions.js";
import { allowedModules, requestedModule } from "../src/admin/modules.js";

test("profile editing validates known permissions and their dependencies", () => {
  assert.deepEqual(
    normalizeProfile({
      name: "  Editor   de equipo  ",
      description: " Contenidos ",
      permissions: ["news.edit", "news.edit"],
    }),
    {
      name: "Editor de equipo",
      description: "Contenidos",
      permissions: ["news.edit"],
      active: true,
    },
  );
  for (const values of [
    { name: "", permissions: ["news.edit"] },
    { name: "a".repeat(61), permissions: ["news.edit"] },
    { name: "Prueba", permissions: [] },
    { name: "Prueba", permissions: ["owner"] },
    { name: "Prueba", permissions: ["santa.mail"] },
    { name: "Prueba", permissions: ["reports.delete"] },
  ])
    assert.throws(() => normalizeProfile(values));
  assert.deepEqual(togglePermission([], "santa.mail", true), [
    "santa.view",
    "santa.mail",
  ]);
  assert.deepEqual(
    togglePermission(
      ["santa.view", "santa.manage", "santa.mail"],
      "santa.view",
      false,
    ),
    [],
  );
  assert.deepEqual(togglePermission([], "reports.delete", true), [
    "reports.view",
    "reports.delete",
  ]);
});

test("explicit membership overrides old custom claims and missing or disabled profiles fail closed", () => {
  const membership = { role: "admin", active: true, profileId: "editor" };
  const profile = {
    name: "Editor",
    active: true,
    permissions: ["news.edit", "unknown"],
  };
  const values = {
    claims: { admin: true },
    emailVerified: true,
    membership,
    profileId: "editor",
    profile,
  };
  assert.deepEqual(resolveAccess(values).permissions, ["news.edit"]);
  assert.equal(
    resolveAccess({ ...values, membership: { ...membership, active: false } }),
    null,
  );
  assert.equal(resolveAccess({ ...values, profile: null }), null);
  assert.equal(
    resolveAccess({ ...values, profile: { ...profile, active: false } }),
    null,
  );
  assert.equal(resolveAccess({ ...values, profileId: "different" }), null);
  assert.equal(resolveAccess({ ...values, profile: { ...profile, permissions: "news.edit" } }), null);
  assert.equal(
    resolveAccess({ ...values, membership: { ...membership, profileId: "" } }),
    null,
  );
  assert.equal(resolveAccess({ ...values, emailVerified: false }), null);
});

test("principal and legacy access remain available until a profile is assigned", () => {
  assert.equal(resolveAccess({ claims: { admin: true } }).owner, true);
  assert.deepEqual(
    resolveAccess({
      emailVerified: true,
      membership: { role: "admin", active: true },
    }).permissions,
    ALL_PERMISSIONS,
  );
  assert.equal(
    resolveAccess({
      emailVerified: true,
      membership: { role: "owner", active: true },
    }).owner,
    true,
  );
  assert.equal(
    resolveAccess({
      emailVerified: true,
      membership: { role: "unexpected", active: true },
    }),
    null,
  );
  assert.equal(resolveAccess(), null);
});

test("navigation and delegation are limited to the resolved permission set", () => {
  const permissions = ["news.edit", "santa.view"];
  assert.deepEqual(
    allowedModules(permissions).map((module) => module.id),
    ["news", "santa"],
  );
  assert.equal(requestedModule("amigo-secreto").id, "santa");
  assert.equal(requestedModule("concurso").id, "quiz");
  assert.equal(canGrant({ owner: false, permissions }, ["news.edit"]), true);
  assert.equal(canGrant({ owner: false, permissions }, ["news.delete"]), false);
  assert.equal(canGrant(null, []), false);
});

test("the server and profile editor share exactly the same permission catalog", () => {
  const rules = readFileSync("firestore.rules", "utf8");
  const catalog = rules.match(
    /function allPermissions\(\)\s*\{\s*return \[([^\]]+)\]/,
  )[1];
  const keys = [...catalog.matchAll(/'([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(keys, ALL_PERMISSIONS);
});
