import { test } from "node:test";
import assert from "node:assert/strict";
import {
  greetingPayload,
  greetingText,
  greetingDate,
} from "../src/lib/greetings.js";

test("named greetings keep recipient and signature while anonymous greetings discard the supplied name", () => {
  const named = greetingPayload({
    recipient: " Equipo ST ",
    authorName: " Ana ",
    message: " Gracias por todo. ",
  });
  assert.equal(named.authorName, "Ana");
  assert.equal(named.recipient, "Equipo ST");
  assert.equal(
    greetingText(named),
    "Para Equipo ST:\n\nGracias por todo.\n\nCon cariño, Ana",
  );
  const anonymous = greetingPayload({
    ...named,
    authorName: "Nombre privado",
    isAnonymous: true,
  });
  assert.equal(anonymous.authorName, "Anónimo");
  assert.ok(!JSON.stringify(anonymous).includes("Nombre privado"));
  assert.ok(greetingText(anonymous).endsWith("Con cariño, Anónimo"));
  assert.equal(
    greetingPayload({ message: "Para todos", isAnonymous: true }).recipient,
    "",
  );
});
test("greeting validation rejects blank messages, invalid signatures and overflow while preserving multiline text", () => {
  for (const values of [
    { message: "  " },
    { message: "ok" },
    { message: "x".repeat(1001) },
    { authorName: "a" },
    { authorName: "Ana\nOtra" },
    { recipient: "x".repeat(81) },
    { message: null },
    { isAnonymous: "true" },
  ])
    assert.throws(() =>
      greetingPayload({ authorName: "Ana", message: "Saludos", ...values }),
    );
  assert.equal(
    greetingPayload({ authorName: "Ana", message: "Gracias\npor todo" })
      .message,
    "Gracias\npor todo",
  );
  assert.equal(greetingDate(null), "Fecha pendiente");
  assert.ok(
    greetingDate({ toDate: () => new Date("2026-11-20T03:30:00Z") }).includes(
      "19",
    ),
  );
});
