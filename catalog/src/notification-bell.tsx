import { NotificationBell, type NotificationBellLabels, type NotificationEntry } from "@ductura/ui";
import type { ReactNode } from "react";

import type { CatalogState } from "./coverage";

// The app's own texts (packages/app host/shell/notifications/text.ts), repeated here for the catalogue.
const LABELS: NotificationBellLabels = {
  button: "Obavijesti",
  buttonWithCount: (n) => `Obavijesti, nepročitanih: ${n}`,
  panel: "Popis obavijesti",
  empty: "Nema obavijesti.",
  unavailable: "Obavijesti trenutačno nisu dostupne.",
  unreadMark: "Novo",
  changed: (n) => (n === 0 ? "Nema nepročitanih obavijesti." : `Nepročitanih obavijesti: ${n}`),
};

// Invented entries only; the links lead nowhere outside the catalogue.
const ENTRIES: NotificationEntry[] = [
  { id: "n1", text: "Novi komentar na radu", when: "20. 11. 2026. 14:05", read: false, href: "#rad-izmisljeni-1" },
  { id: "n2", text: "Nova verzija zadatka", when: "19. 11. 2026. 09:30", read: false, href: "#rad-izmisljeni-2" },
  { id: "n3", text: "Zabilježena predaja", when: "17. 11. 2026. 18:12", read: true, href: "#rad-izmisljeni-3" },
];

// The list is a fixed popover: in the catalogue the bell stays closed so it covers no other entry,
// and a line under it says what the list shows once the bell is pressed.
const bell = (note: string, props: { entries?: NotificationEntry[]; unread?: number; status?: "ready" | "unavailable" } = {}) => (
  <div>
    <NotificationBell entries={props.entries ?? []} unread={props.unread ?? 0} status={props.status ?? "ready"}
      labels={LABELS} onOpenEntry={() => undefined} />
    <p>{note}</p>
  </div>
);

export const notificationBellEntries = {
  NotificationBell: {
    prazno: () => bell("Nema obavijesti."),
    učitavanje: () => bell("Prije prvog čitanja zvonce ne pokazuje broj."),
    greška: () => bell("Obavijesti trenutačno nisu dostupne.", { entries: ENTRIES, unread: 2, status: "unavailable" }),
    puno: () => bell("Nepročitanih obavijesti: 2", { entries: ENTRIES, unread: 2 }),
    onemogućeno: () => bell("Obavijesti još nisu uključene.", { status: "unavailable" }),
  } satisfies Record<CatalogState, () => ReactNode>,
};
