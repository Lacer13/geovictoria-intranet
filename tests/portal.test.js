import { test } from "node:test";
import assert from "node:assert/strict";
import { atmospherePreference } from "../src/lib/appearance.js";

import {
  christmasInfo,
  limaDate,
  downloadChristmasCalendar,
} from "../src/lib/season.js";
import {
  normalize,
  readPreference,
  savePreference,
} from "../src/lib/preferences.js";

test("appearance preferences retain a previous pause and safely migrate missing or corrupt values", () => {
  assert.equal(atmospherePreference(null, "on"), "soft");
  assert.equal(atmospherePreference("", "off"), "off");
  assert.equal(atmospherePreference("unknown", "off"), "off");
  assert.equal(atmospherePreference("festive", "off"), "festive");
  assert.equal(atmospherePreference("off", "on"), "off");
});

test("countdown uses the calendar day in Lima around UTC midnight", () => {
  assert.deepEqual(christmasInfo(new Date("2026-12-25T03:00:00Z")), {
    year: 2026,
    days: 1,
  });
  assert.deepEqual(christmasInfo(new Date("2026-12-25T05:00:00Z")), {
    year: 2026,
    days: 0,
  });
  assert.equal(limaDate(new Date("2026-11-17T02:00:00Z")).getDate(), 16);
});
test("countdown advances to next Christmas only after December 25 in Lima", () => {
  assert.deepEqual(christmasInfo(new Date("2026-12-26T04:59:59Z")), {
    year: 2026,
    days: 0,
  });
  assert.deepEqual(christmasInfo(new Date("2026-12-26T05:00:00Z")), {
    year: 2027,
    days: 364,
  });
  assert.deepEqual(christmasInfo(new Date("2026-11-16T12:00:00Z")), {
    year: 2026,
    days: 39,
  });
});
test("search is insensitive to accents, whitespace and case", () => {
  assert.equal(normalize("  TECNOLOGÍA  "), "tecnologia");
  assert.equal(normalize("Ludeña"), "ludena");
  assert.equal(normalize(undefined), "");
});
test("blocked storage never prevents the portal from opening", () => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("Storage blocked");
    },
  });
  assert.equal(readPreference("geoTheme", "light"), "light");
  assert.doesNotThrow(() => savePreference("geoTheme", "dark"));
  delete globalThis.localStorage;
});
test("calendar export creates a valid all-day event and cleans up its URL", async () => {
  let blob;
  let clicked = false;
  let revoked;
  const create = URL.createObjectURL;
  const revoke = URL.revokeObjectURL;
  const timeout = globalThis.setTimeout;
  const link = {
    click() {
      clicked = true;
    },
  };
  globalThis.document = { createElement: () => link };
  URL.createObjectURL = (value) => {
    blob = value;
    return "blob:test-calendar";
  };
  URL.revokeObjectURL = (value) => {
    revoked = value;
  };
  globalThis.setTimeout = (callback) => {
    callback();
    return 0;
  };
  try {
    downloadChristmasCalendar(2026);
    const text = await blob.text();
    assert.ok(clicked);
    assert.equal(link.download, "navidad-2026.ics");
    assert.equal(link.href, "blob:test-calendar");
    assert.match(
      text,
      /DTSTART;VALUE=DATE:20261225\r\nDTEND;VALUE=DATE:20261226/,
    );
    assert.match(text, /UID:navidad-2026@geovictoria-intranet/);
    assert.match(text, /BEGIN:VCALENDAR\r\n/);
    assert.equal(revoked, "blob:test-calendar");
  } finally {
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    globalThis.setTimeout = timeout;
    delete globalThis.document;
  }
});
