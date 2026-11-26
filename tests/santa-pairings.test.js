import { test } from "node:test";
import assert from "node:assert/strict";
import {
  santaPairings,
  pairingsCSV,
  pairingsTSV,
} from "../src/lib/santaPairings.js";
import {
  needsPasswordSetup,
  validateNewPassword,
} from "../src/lib/adminPassword.js";

const event = {
  participantIds: ["a", "b", "c"],
  people: {
    a: { name: "Ángela", email: "angela@example.test" },
    b: { name: "Bruno", email: "bruno@example.test" },
    c: { name: "Celia", email: "celia@example.test" },
  },
  assignments: {
    a: { recipientId: "b", cardId: "private-a" },
    b: { recipientId: "c", cardId: "private-b" },
    c: { recipientId: "a", cardId: "private-c" },
  },
};
test("mass consultation searches both sides and sorts without modifying the draw", () => {
  const before = JSON.stringify(event);
  assert.deepEqual(
    santaPairings(event).map((row) => row.id),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    santaPairings(event, "angela").map((row) => row.id),
    ["a", "c"],
  );
  assert.deepEqual(
    santaPairings(event, "celia@example.test").map((row) => row.id),
    ["b", "c"],
  );
  assert.deepEqual(
    santaPairings(event, "", "recipient").map((row) => row.id),
    ["c", "a", "b"],
  );
  assert.equal(santaPairings(event, "inexistente").length, 0);
  assert.equal(JSON.stringify(event), before);
});
test("pair exports match the filtered rows and omit private invitation tokens", () => {
  const rows = santaPairings(event, "Bruno");
  const csv = pairingsCSV(rows);
  assert.match(csv, /Entrega/);
  assert.match(csv, /Bruno/);
  assert.doesNotMatch(csv, /private-|@|cardId/);
  assert.match(pairingsCSV(rows, true), /bruno@example.test/);
  assert.equal(pairingsTSV(rows).split("\n").length, 3);
  const dangerous = [
    { giver: { name: "=SUM(A1)\tOtra" }, recipient: { name: "+123\nDato" } },
  ];
  assert.match(pairingsTSV(dangerous), /'=SUM/);
  assert.match(pairingsTSV(dangerous), /'\+123/);
  assert.equal(pairingsTSV(dangerous).split("\n").length, 2);
});
test("one hundred pairs remain available and missing assignments are explicit", () => {
  const ids = Array.from({ length: 100 }, (_, i) => `p${i}`);
  const large = {
    participantIds: ids,
    people: Object.fromEntries(
      ids.map((id, i) => [id, { name: `Persona ${i}` }]),
    ),
    assignments: Object.fromEntries(
      ids.map((id, i) => [id, { recipientId: ids[(i + 1) % 100] }]),
    ),
  };
  assert.equal(santaPairings(large).length, 100);
  assert.equal(pairingsTSV(santaPairings(large)).split("\n").length, 101);
  assert.match(
    pairingsCSV(santaPairings({ ...event, assignments: {} })),
    /Sin asignación/,
  );
});
test("password onboarding uses the provider timestamp instead of a local acknowledgement", () => {
  assert.equal(needsPasswordSetup({}, undefined), false);
  assert.equal(needsPasswordSetup({ passwordSetupAt: 1000 }, 1000), true);
  assert.equal(needsPasswordSetup({ passwordSetupAt: 1000 }, 999), true);
  assert.equal(needsPasswordSetup({ passwordSetupAt: 1000 }, 1001), false);
  assert.throws(() => needsPasswordSetup({ passwordSetupAt: 1000 }, undefined));
  assert.throws(() => needsPasswordSetup({ passwordSetupAt: "invalid" }, 1001));
  assert.throws(() => validateNewPassword("short", "short"));
  assert.throws(() => validateNewPassword("Una frase de prueba", "Otra frase"));
  assert.equal(
    validateNewPassword("Una frase de prueba", "Una frase de prueba"),
    "Una frase de prueba",
  );
});
