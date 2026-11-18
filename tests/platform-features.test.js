import { test } from "node:test";
import assert from "node:assert/strict";
import { contentPayload, sameContent } from "../src/lib/content.js";
import { buildSearchIndex, searchIndex } from "../src/lib/search.js";
import {
  isPublicationRead,
  parseReadNews,
  publicationVersion,
} from "../src/lib/news.js";
import {
  mailSettingsVersion,
  santaTestEmailParams,
} from "../src/lib/secretSantaEmail.js";
import {
  isWelcomeDismissed,
  rememberWelcome,
  setWelcomeDismissed,
  shouldShowWelcome,
} from "../src/lib/welcome.js";

test("content edits retain publication dates and reject invalid records", () => {
  const original = {
    id: "article",
    title: "Aviso",
    desc: "Texto",
    type: "anuncio",
    date: "18 nov",
    timestamp: "2026-11-18T12:00:00Z",
  };
  const updated = contentPayload("news", {
    ...original,
    title: "Aviso corregido",
  });
  assert.equal(updated.timestamp, original.timestamp);
  assert.equal(updated.date, original.date);
  assert.equal(updated.title, "Aviso corregido");
  assert.ok(!("id" in updated));
  assert.ok(sameContent("news", original, { ...original }));
  assert.ok(
    !sameContent("news", original, {
      ...original,
      desc: "Cambio de otro editor",
    }),
  );
  assert.ok(!sameContent("news", original, null));
  assert.throws(() =>
    contentPayload("news", { ...original, title: " ".repeat(10) }),
  );
  assert.throws(() =>
    contentPayload("news", { ...original, desc: "x".repeat(10001) }),
  );
  const contact = contentPayload("directory", {
    name: "  Persona ",
    department: " Soporte ",
    email: "PERSONA@example.test",
    color: "#135e40",
  });
  assert.equal(contact.email, "persona@example.test");
  assert.equal(contact.name, "Persona");
  assert.throws(() =>
    contentPayload("directory", {
      ...contact,
      email: "bad address@example.test",
    }),
  );
  assert.throws(() =>
    contentPayload("directory", { ...contact, color: "javascript:bad" }),
  );
});
test("search finds full guide content, emails and publications with ranked multiword matches", () => {
  const index = buildSearchIndex({
    articles: [
      {
        id: "policy",
        title: "Guía de ausencias",
        category: "Personas",
        intro: "Orientación",
        sections: [["Solicitud", "Coordina tus vacaciones con anticipación"]],
      },
    ],
    directory: [
      {
        id: "p",
        name: "Álex",
        department: "Tecnología",
        email: "alex@example.test",
      },
    ],
    news: [
      {
        id: "n",
        title: "Vacaciones",
        date: "18 nov",
        desc: "Revisa el calendario y los días disponibles",
      },
    ],
  });
  assert.equal(searchIndex(index, "vacaciones")[0].id, "news:n");
  assert.equal(
    searchIndex(index, "coordina anticipacion")[0].id,
    "guide:policy",
  );
  assert.equal(searchIndex(index, "alex@example.test")[0].id, "contact:p");
  assert.equal(searchIndex(index, "tecnologia", "Personas").length, 1);
  assert.equal(
    searchIndex(index, "calendario disponibles", "Publicaciones")[0].id,
    "news:n",
  );
  assert.equal(searchIndex(index, "nada coincide").length, 0);
  const many = buildSearchIndex({
    news: Array.from({ length: 40 }, (_, i) => ({
      id: String(i),
      title: `Aviso ${i}`,
      desc: "Información",
    })),
  });
  assert.equal(searchIndex(many, "aviso", "Publicaciones").length, 40);
});
test("read receipts are revision specific and invalid browser state is discarded", () => {
  const news = {
    id: "n",
    title: "Aviso",
    desc: "Original",
    type: "anuncio",
    timestamp: "2026-11-18",
  };
  const receipts = { n: publicationVersion(news) };
  assert.ok(isPublicationRead(news, receipts));
  assert.ok(
    !isPublicationRead({ ...news, desc: "Contenido corregido" }, receipts),
  );
  assert.ok(!isPublicationRead({ ...news, id: "new" }, receipts));
  assert.deepEqual(parseReadNews("oops"), {});
  assert.deepEqual(parseReadNews("[]"), {});
  assert.deepEqual(parseReadNews('{"n":"abcd","bad":true}'), { n: "abcd" });
});
test("connection test has no participant token or real assignment and uses the authorized recipient", () => {
  const params = santaTestEmailParams(
    "ADMIN@example.test",
    "https://intranet.example.test/path",
  );
  assert.equal(params.to_email, "admin@example.test");
  assert.equal(
    params.private_url,
    "https://intranet.example.test/amigo-secreto",
  );
  assert.ok(!params.private_url.includes("#"));
  assert.match(params.recipient_name, /PRUEBA/);
  assert.equal(Object.keys(params).length, 8);
  assert.throws(() => santaTestEmailParams("invalid", "https://example.test"));
  assert.throws(() =>
    santaTestEmailParams("admin@example.test", "http://example.test"),
  );
  const settings = {
    enabled: true,
    serviceId: "service_a",
    templateId: "template_a",
    publicKey: "public_a",
  };
  assert.equal(
    mailSettingsVersion(settings),
    mailSettingsVersion({ ...settings, serviceId: " service_a " }),
  );
  assert.notEqual(
    mailSettingsVersion(settings),
    mailSettingsVersion({ ...settings, templateId: "template_b" }),
  );
});
test("campaign opt out survives a new session while manual entry points remain independent", () => {
  const local = new Map(),
    session = new Map();
  globalThis.localStorage = {
    getItem: (k) => local.get(k) ?? null,
    setItem: (k, v) => local.set(k, v),
  };
  globalThis.sessionStorage = {
    getItem: (k) => session.get(k) ?? null,
    setItem: (k, v) => session.set(k, v),
  };
  try {
    assert.ok(shouldShowWelcome("/"));
    assert.ok(!shouldShowWelcome("/admin"));
    rememberWelcome();
    assert.ok(!shouldShowWelcome("/"));
    session.clear();
    assert.ok(shouldShowWelcome("/"));
    setWelcomeDismissed(true);
    assert.ok(isWelcomeDismissed());
    assert.ok(!shouldShowWelcome("/"));
    session.clear();
    assert.ok(!shouldShowWelcome("/"));
    setWelcomeDismissed(false);
    assert.ok(shouldShowWelcome("/"));
  } finally {
    delete globalThis.localStorage;
    delete globalThis.sessionStorage;
  }
});
