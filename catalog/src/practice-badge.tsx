import { PracticeBadge } from "@ductura/ui";
import type { ReactNode } from "react";

import type { CatalogState } from "./coverage";

// The mark has no states of its own: it appears only when the server says `practice: true`.
// Every catalogue state needs visible text, so each shows an invented assignment title beside the (absent or present) mark.
const row = (practice: boolean | null, note: string) => (
  <p>Izmišljeni seminarski zadatak <PracticeBadge practice={practice} /> <small>{note}</small></p>
);

export const practiceBadgeEntries = {
  PracticeBadge: {
    prazno: () => row(null, "Poslužitelj nije poslao polje: bez oznake."),
    učitavanje: () => row(null, "Zadatak se učitava: bez oznake."),
    greška: () => row(false, "Redovni zadatak: bez oznake."),
    puno: () => row(true, "Probni zadatak."),
    onemogućeno: () => row(true, "Probni zadatak, samo za čitanje."),
  } satisfies Record<CatalogState, () => ReactNode>,
};
