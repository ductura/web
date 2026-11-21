import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const FORBIDDEN = /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|axios)\b|["'`]\/?api\/|<form\b/;

it("WEB-1901 the wizard and the badge reach the server only through the shared client", () => {
  const dirs = [import.meta.dirname, join(import.meta.dirname, "../../../../../ui/src/components/practice-badge")];
  for (const dir of dirs) {
    const files = readdirSync(dir).filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) expect(readFileSync(join(dir, file), "utf8"), file).not.toMatch(FORBIDDEN);
  }
});
