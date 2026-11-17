import { test } from "node:test";
import assert from "node:assert/strict";
import { requestSantaEmail } from "../src/lib/secretSantaEmail.js";
const settings = {
  serviceId: "service_demo",
  templateId: "template_demo",
  publicKey: "public_demo",
};
const params = {
  to_email: "test@example.test",
  recipient_name: "Demo",
  private_url: "https://example.test/amigo-secreto/ver#private",
};
test("the email service receives a single saved recipient and no private key", async () => {
  let calls = 0;
  const result = await requestSantaEmail(
    settings,
    params,
    async (url, options) => {
      calls++;
      assert.equal(url, "https://api.emailjs.com/api/v1.0/email/send");
      const body = JSON.parse(options.body);
      assert.deepEqual(body, {
        service_id: settings.serviceId,
        template_id: settings.templateId,
        user_id: settings.publicKey,
        template_params: params,
      });
      assert.equal(options.method, "POST");
      assert.ok(options.signal);
      return { ok: true, status: 200 };
    },
  );
  assert.equal(calls, 1);
  assert.deepEqual(result, { state: "accepted", provider: "emailjs" });
});
test("lost connections are uncertain and never automatically retried", async () => {
  let calls = 0;
  await assert.rejects(
    requestSantaEmail(settings, params, async () => {
      calls++;
      throw new Error("network");
    }),
    (error) => error.uncertain === true && error.stopBatch === true,
  );
  assert.equal(calls, 1);
});
test("a provider outage is uncertain and stops the batch", async () => {
  await assert.rejects(
    requestSantaEmail(settings, params, async () => ({
      ok: false,
      status: 503,
    })),
    (error) => error.uncertain === true && error.stopBatch === true,
  );
});
test("quota failures stop pending sends without reporting acceptance", async () => {
  await assert.rejects(
    requestSantaEmail(settings, params, async () => ({
      ok: false,
      status: 429,
    })),
    (error) =>
      !error.uncertain &&
      error.stopBatch === true &&
      /límite/.test(error.message),
  );
});
test("an individual invalid address can be reviewed independently", async () => {
  await assert.rejects(
    requestSantaEmail(settings, params, async () => ({
      ok: false,
      status: 422,
    })),
    (error) => !error.uncertain && error.stopBatch === false,
  );
  await assert.rejects(
    requestSantaEmail(settings, params, async () => ({
      ok: false,
      status: 401,
    })),
    (error) => error.stopBatch === true,
  );
});
