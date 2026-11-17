import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CARD_PATTERN,
  MAX_PARTICIPANTS,
  createAssignmentPlan,
  emailTemplateParams,
  emptyPerson,
  normalizeRoster,
  parseParticipantLines,
  privateSantaLink,
  randomInt,
  safeCSV,
  validMailSettings,
} from "../src/lib/secretSanta.js";

test("every draw is a complete permutation without self-assignment", () => {
  for (const size of [2, 3, 4, 10, 25, 100]) {
    const ids = Array.from({ length: size }, (_, i) => String(i));
    for (let run = 0; run < 12; run++) {
      const plan = createAssignmentPlan(ids);
      assert.deepEqual(Object.keys(plan).sort(), [...ids].sort());
      assert.deepEqual(
        Object.values(plan)
          .map((p) => p.recipientId)
          .sort(),
        [...ids].sort(),
      );
      assert.ok(ids.every((id) => plan[id].recipientId !== id));
      assert.ok(Object.values(plan).every((p) => CARD_PATTERN.test(p.cardId)));
      assert.equal(
        new Set(Object.values(plan).map((p) => p.cardId)).size,
        size,
      );
    }
  }
});
test("fixed points are rejected before a valid permutation is returned", () => {
  let calls = 0;
  const plan = createAssignmentPlan(["a", "b", "c"], (max) =>
    ++calls <= 2 ? max - 1 : 0,
  );
  assert.equal(calls, 4);
  assert.ok(
    Object.entries(plan).every(([id, pair]) => id !== pair.recipientId),
  );
});
test("unsafe or impossible random generators never produce partial results", () => {
  assert.throws(() => createAssignmentPlan(["a"]), /lista/);
  assert.throws(() => createAssignmentPlan(["a", "a"]), /lista/);
  assert.throws(
    () => createAssignmentPlan(["a", "b"], (max) => max),
    /generador/,
  );
  assert.throws(
    () => createAssignmentPlan(["a", "b"], (max) => max - 1),
    /No se pudo/,
  );
  assert.throws(
    () =>
      createAssignmentPlan(
        ["a", "b"],
        () => 0,
        () => "a".repeat(64),
      ),
    /únicos/,
  );
});
test("random integer samples remain inside the requested range", () => {
  for (const max of [1, 2, 3, 7, 100])
    for (let i = 0; i < 100; i++) {
      const value = randomInt(max);
      assert.ok(Number.isInteger(value) && value >= 0 && value < max);
    }
  for (const bad of [0, -1, 1.5, Infinity]) assert.throws(() => randomInt(bad));
});
test("rosters normalize emails, allow namesakes and reject repeated addresses", () => {
  const a = {
    ...emptyPerson(),
    name: " Ana   Pérez ",
    email: " ANA@EXAMPLE.TEST ",
  };
  const b = { ...emptyPerson(), name: "Ana Pérez", email: "otra@example.test" };
  const roster = normalizeRoster([a, emptyPerson(), b], true);
  assert.equal(roster.participantIds.length, 2);
  assert.equal(roster.people[a.id].name, "Ana Pérez");
  assert.equal(roster.people[a.id].email, "ana@example.test");
  assert.throws(
    () => normalizeRoster([a, { ...b, email: "ana@example.test" }]),
    /repetido/,
  );
  assert.throws(
    () => normalizeRoster([{ ...a, email: "bad\nBcc:other@example.test" }]),
    /correo/,
  );
  assert.throws(() => normalizeRoster([{ ...a, name: "" }]), /nombre/);
  assert.throws(() => normalizeRoster([a], true), /dos personas/);
  assert.throws(
    () => normalizeRoster([a, { ...b, id: a.id }]),
    /identificador/,
  );
});
test("bulk import supports semicolons, tabs and comma-separated names", () => {
  const rows = parseParticipantLines(
    "Nombre; correo\nAna Pérez;ana@example.test\nBruno\tbruno@example.test\nPérez, Carla,carla@example.test",
  );
  assert.equal(rows.length, 3);
  assert.equal(rows[2].name, "Pérez, Carla");
  assert.equal(normalizeRoster(rows).participantIds.length, 3);
  assert.throws(() => parseParticipantLines("Sin correo"), /Línea 1/);
  assert.throws(
    () =>
      normalizeRoster(
        Array.from({ length: MAX_PARTICIPANTS + 1 }, (_, i) => ({
          ...emptyPerson(),
          name: `Persona ${i}`,
          email: `p${i}@example.test`,
        })),
      ),
    /hasta 100/,
  );
});
test("private links place their unguessable key in the fragment, not the query", () => {
  const token = "b".repeat(64);
  const url = new URL(privateSantaLink("https://example.test", token));
  assert.equal(url.pathname, "/amigo-secreto/ver");
  assert.equal(url.search, "");
  assert.equal(url.hash, "#" + token);
  assert.throws(() =>
    privateSantaLink("https://example.test", "known-short-key"),
  );
});
test("email parameters use only the saved giver address and correct saved assignment", () => {
  const ids = ["a", "b"];
  const event = {
    title: "Navidad",
    exchangeDate: "2026-12-24",
    budget: "S/ 50",
    notes: "Un detalle",
    people: {
      a: { name: "Ana", email: "ana@example.test" },
      b: { name: "Bruno", email: "bruno@example.test" },
    },
    assignments: createAssignmentPlan(ids, () => 0),
  };
  const params = emailTemplateParams(event, "a", "https://example.test");
  assert.equal(params.to_email, "ana@example.test");
  assert.equal(params.recipient_name, "Bruno");
  assert.equal(
    new URL(params.private_url).hash,
    "#" + event.assignments.a.cardId,
  );
  assert.ok(!JSON.stringify(params).includes("bruno@example.test"));
  assert.equal(params.exchange_date, "24 de diciembre de 2026");
});
test("mail configuration requires enabled public identifiers, not mailbox credentials", () => {
  assert.equal(
    validMailSettings({
      enabled: true,
      serviceId: "service_test",
      templateId: "template_test",
      publicKey: "public-key",
    }),
    true,
  );
  assert.equal(
    validMailSettings({
      enabled: false,
      serviceId: "service_test",
      templateId: "template_test",
      publicKey: "public-key",
    }),
    false,
  );
  assert.equal(
    validMailSettings({
      enabled: true,
      serviceId: "",
      templateId: "template",
      publicKey: "public",
    }),
    false,
  );
  assert.equal(
    validMailSettings({
      enabled: true,
      serviceId: "service",
      templateId: "template",
      publicKey: "password with spaces",
    }),
    false,
  );
});
test("CSV recovery exports escape quotes and spreadsheet formulas", () => {
  const text = safeCSV([
    ["Nombre", "Correo"],
    ['=HYPERLINK("x")', "ana@example.test"],
    ["+SUM(1)", "@formula"],
  ]);
  assert.ok(text.startsWith("\ufeff"));
  assert.match(text, /"'=HYPERLINK\(""x""\)"/);
  assert.match(text, /"'\+SUM\(1\)"/);
  assert.match(text, /"'@formula"/);
});
