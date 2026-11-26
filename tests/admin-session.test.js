import { test } from "node:test";
import assert from "node:assert/strict";
import { loadAdminIdentity, sessionNeedsLogin } from "../src/admin/session.js";
import { resolveAccess } from "../src/admin/permissions.js";

test("verification in another tab refreshes the account and the token before resolving permissions", async () => {
  let forced = 0;
  const user = {
    emailVerified: false,
    async reload() { this.emailVerified = true; },
    async getIdTokenResult(force) {
      if (force) forced++;
      return { claims: { email_verified: !!force } };
    },
  };
  const { claims } = await loadAdminIdentity(user);
  assert.equal(user.emailVerified, true);
  assert.equal(claims.email_verified, true);
  assert.equal(forced, 1);
  assert.ok(resolveAccess({ claims, emailVerified: user.emailVerified, membership: { role: "admin", active: true } }));
  assert.equal(resolveAccess({ claims, emailVerified: user.emailVerified, membership: { role: "admin", active: false } }), null);
});

test("an unverified or already refreshed session does not repeatedly force tokens", async () => {
  for (const verified of [false, true]) {
    let forced = 0;
    const user = {
      emailVerified: verified,
      async reload() {},
      async getIdTokenResult(force) {
        if (force) forced++;
        return { claims: { email_verified: verified } };
      },
    };
    await loadAdminIdentity(user);
    await loadAdminIdentity(user);
    assert.equal(forced, 0);
    if (!verified) assert.equal(resolveAccess({ emailVerified: user.emailVerified, membership: { role: "admin", active: true } }), null);
  }
});

test("an invalidated session returns to login while network failures remain retryable", async () => {
  for (const code of ["auth/user-token-expired", "auth/invalid-user-token", "auth/user-disabled", "auth/user-not-found"]) {
    const error = Object.assign(new Error("Session invalidated"), { code });
    await assert.rejects(loadAdminIdentity({ async reload() { throw error; } }), error);
    assert.equal(sessionNeedsLogin(error), true);
  }
  assert.equal(sessionNeedsLogin({ code: "auth/network-request-failed" }), false);
});
