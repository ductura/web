import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PracticeBadge } from "./PracticeBadge";

describe("PracticeBadge (WEB-1901)", () => {
  it("shows the mark only when the server field is true", () => {
    expect(renderToStaticMarkup(<PracticeBadge practice />)).toContain("Probni");
    expect(renderToStaticMarkup(<PracticeBadge practice={false} />)).toBe("");
    expect(renderToStaticMarkup(<PracticeBadge practice={null} />)).toBe("");
    expect(renderToStaticMarkup(<PracticeBadge practice={undefined} />)).toBe("");
  });

  it("takes its word from the catalogue", () => {
    expect(renderToStaticMarkup(<PracticeBadge practice label="Probni zadatak" />)).toContain("Probni zadatak");
  });
});
