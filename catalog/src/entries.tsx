import {
  AssistantComingSoon, CheckActionList, AppointmentCalendar, Button, Card, Checkbox, CommandPalette, CommentThread, DatePicker, ContextMenu, DataTable, Details, Dialog, Drawer, ErrorScreen, FindBar, Fingerprint,
  EditorOnboarding, EditorOutline, EditorProgress, EditorToolbar, Icon, ICON_NAMES, KeyValueList, ObjectToolbar, PanelTabs, Popover, PreviewDialog, RouteLoading, SaveState, SearchableList, Select, ShortcutList, ShortcutListDialog, ShortcutsDialog,
  Skeleton, SourceForm, StateTag, Steps, SUBMISSION_STATES, Tag, TextArea, TextField, ToastRegion,
  type Appointment, type AppointmentCalendarLabels, type CommentThreadData, type CommentThreadLabels, type DatePickerLabels, type Command, type DataTableColumn, type FindBarLabels, type IconName, type MenuEntry, type ShortcutGroup, type ShortcutListGroup,
} from "@ductura/ui";
import { useRef, useState } from "react";

import { messagesHr as t } from "../../locales/hr.ts";
import type { OverviewRow } from "../../src/client/teacher-reads";
import { BeforeSubmitView, type BeforeSubmitViewProps } from "../../src/components/predaja/BeforeSubmit.tsx";
import { DeclarationView, type DeclarationViewProps, type RecordedSummary } from "../../src/components/predaja/Declaration.tsx";
import type { SubmissionNote, SubmissionReceipt } from "../../src/client/submission.ts";
import { VECTOR_9_1 } from "../../src/client/provenance-fake.ts";
import { WorkspaceTopBarView } from "../../src/components/editor/WorkspaceTopBar.tsx";
import { MentorshipRequestsView } from "../../src/components/teacher/MentorshipRequests.tsx";
import type { ProcessSummaryV1 } from "../../src/components/summary/ProcessSummaryView.tsx";
import {
  AppShell, AssignmentOverview, CourseStudents, EmptyHome, LiveWorkFrame, MentoredWorks, MentorshipRequests, MyAssignments,
  NoteDialog, OutlinePanel, ProvenancePanel, ReceiptPanel, StudentHome, SubmissionView, SubmitDialog, TeacherCourses, VerificationForm,
  type AssignmentSubmission, type LiveWorkFrameData, type ReceiptRead, type SubmissionViewProps, type MentoredWork, type MyCourse, type OutlineRow, type RequestsRead,
  type TeacherCourse,
} from "../../src/components/index.ts";

import { DiffView, Timeline } from "@ductura/ui";
import { ProofDialog, SourceProofsPanel } from "../../src/components/index.ts";
import { proofsPath, type ProofsRead, type SourceProof } from "../../src/client/source-proofs.ts";
import type { ProofPicture } from "../../src/components/editor/sources/proofs/crop.ts";
import { startCapture, type Capture } from "../../src/components/editor/sources/proofs/proof-draft.ts";
import type { ProofsDeps } from "../../src/components/editor/sources/proofs/proofs-deps.ts";
import { adminAiCostLimitsEntries } from "./admin-ai-cost-limits";
import { assistantPurposeStateEntries } from "./assistant-purpose-states";
import { assistantBudgetEntries } from "./assistant-budget";
import { declarationAiEntries } from "./declaration-ai";
import { teacherAiAttachmentsEntries } from "./teacher-ai-attachments";
import { accessDeniedEntries } from "./access-denied";
import { practiceBadgeEntries } from "./practice-badge";
import { provenanceShareEntries } from "./provenance-share";
import { problemReportEntries } from "./problem-report";
import { assistantTransferEntries } from "./assistant-transfer";
import { assistantThreadEntry } from "./assistant-thread";
import { wizardEntries } from "./wizard";
import type { CatalogEntries, CatalogState } from "./coverage";

type Entry = Record<CatalogState, () => React.ReactNode>;

// Invented example text only; no real people or student work.
const GROUPS = [{ value: "a", label: "Grupa A" }, { value: "b", label: "Grupa B" }];
const SAMPLE_DIGEST = "0123456789abcdef".repeat(4);
const SAMPLE_WORKS = [{ title: "Izmišljeni seminar", pages: 12 }, { title: "Izmišljeni ogled", pages: 4 }];
const WORK_COLUMNS: DataTableColumn<(typeof SAMPLE_WORKS)[number]>[] = [
  { id: "title", header: "Rad", cell: (row) => row.title, rowHeader: true },
  { id: "pages", header: "Stranice", cell: (row) => row.pages, numeric: true, sortValue: (row) => row.pages },
];
const workTable = (caption: string, rows = SAMPLE_WORKS, loading = false) => (
  <DataTable caption={caption} rows={rows} columns={WORK_COLUMNS}
    rowKey={(row) => row.title} empty="Još nema radova." loading={loading} />
);

const SAMPLE_SOURCES = [
  { id: "a", label: "Izmišljeni županijski zbornik", description: "2026", keywords: "Izmišljeni ured Đ" },
  { id: "b", label: "Izmišljeni vodič kroz izvore", description: "2024" },
];

function SearchableListExample() {
  const [selected, setSelected] = useState("");
  return <div>
    <SearchableList items={SAMPLE_SOURCES} label="Pretraži primjere izvora" onSelect={(item) => setSelected(item.label)} />
    <p role="status">{selected}</p>
  </div>;
}
// The toast region is fixed to the viewport; in the catalogue it sits in the flow.
function ToastInline({ toasts }: { toasts: Parameters<typeof ToastRegion>[0]["toasts"] }) {
  return (
    <>
      <p>Obavijesti: {toasts.length}</p>
      <ToastRegion inline toasts={toasts} onDismiss={() => undefined} label="Obavijesti" closeLabel="Zatvori" />
    </>
  );
}
const ICON_LABELS: Record<IconName, string> = {
  undo: "Poništi", redo: "Ponovi", paragraph: "Odlomak", heading: "Naslov", bold: "Podebljano", italic: "Kurziv",
  bulletList: "Popis", numberedList: "Numerirani popis", quote: "Citat", chevronDown: "Više",
};

function SourceFormExample() {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  return <>
    <Button ref={anchor} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}>Novi izvor</Button>
    <SourceForm open={open} anchor={anchor} allowCite onClose={() => setOpen(false)}
      onSubmit={(source) => { setTitle(source.title); setOpen(false); anchor.current?.focus(); }} />
    <p role="status">{title}</p>
  </>;
}

const sourcePreview = (state: CatalogState) => <SourceForm open floating={false} anchor={{ current: null }}
  pending={state === "učitavanje"} disabled={state === "onemogućeno"}
  error={state === "greška" ? "Dodavanje izvora nije uspjelo." : undefined}
  initial={{ type: "book", authors: [{ kind: "organization", name: "Izmišljeni nakladnički ured" }],
    title: "Izmišljeni priručnik", year: 2026, place: "Izmišljeni grad", publisher: "Izmišljeni nakladnik" }}
  onSubmit={nothing} onClose={nothing} />;

const TOOLBAR_ACTIONS = [
  { id: "preview", label: "Pregled", onSelect: () => undefined },
  { id: "remove", label: "Ukloni", onSelect: () => undefined },
];
const toolbarPreview = (actions: typeof TOOLBAR_ACTIONS) => <ObjectToolbar open floating={false} anchor={{ current: null }} actions={actions} onClose={() => undefined} />;
function PreviewDialogExample() {
  const [open, setOpen] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)}>Pregled slike</Button>
    <PreviewDialog open={open} kind="image" caption="Izmišljeni primjer" onClose={() => setOpen(false)}>
      <svg role="img" aria-label="Izmišljeni dijagram kompostiranja" width="160" height="80" viewBox="0 0 160 80"><rect x="4" y="4" width="152" height="72" fill="none" stroke="currentColor" /></svg>
    </PreviewDialog>
  </>;
}

const REPLAY_TEXT = ["", "Izmišljeni vrt.", "Izmišljeni školski vrt.", "Izmišljeni školski vrt raste."];

function TimelineExample() {
  const [value, setValue] = useState(0);
  return <>
    <Timeline total={REPLAY_TEXT.length - 1} value={value} onChange={setValue} />
    <p>{REPLAY_TEXT[value]}</p>
  </>;
}

const nothing = () => undefined;

const EDITOR_GROUPS = [
  { id: "history", label: "Povijest izmjena", actions: [
    { id: "undo", label: "Poništi", icon: "undo", onSelect: nothing, shortcut: "Control+Z" },
    { id: "redo", label: "Ponovi", icon: "redo", onSelect: nothing, shortcut: "Control+Y", disabled: true },
  ] },
  { id: "block", label: "Stil bloka", actions: [
    { id: "paragraph", label: "Odlomak", icon: "paragraph", onSelect: nothing },
    { id: "heading1", label: "Naslov 1", icon: "heading", onSelect: nothing, pressed: true },
  ] },
  { id: "text", label: "Tekst", actions: [
    { id: "bold", label: "Podebljano", icon: "bold", onSelect: nothing },
    { id: "italic", label: "Kurziv", icon: "italic", onSelect: nothing },
    { id: "bulletList", label: "Popis", icon: "bulletList", onSelect: nothing },
    { id: "quote", label: "Citat", icon: "quote", onSelect: nothing },
  ] },
] as const;
const EDITOR_HEADINGS = [
  { id: "a", number: "1", title: "Izmišljeni uvod", level: 1 as const },
  { id: "b", number: "1.1", title: "Izmišljeni cilj", level: 2 as const },
  { id: "c", number: "2", title: "Izmišljena rasprava", level: 1 as const },
];

// WEB-6A components (invented example text only). Drawer, Popover, FindBar and ContextMenu
// show in the page flow; the palette and the shortcuts dialog are modal, so each state
// opens from its own button, as SourceForm does.
const SAMPLE_COMMANDS: Command[] = [
  { id: "bold", label: "Podebljano", hint: "Ctrl+B", group: "Oblikovanje" },
  { id: "italic", label: "Kurziv", hint: "Ctrl+I", group: "Oblikovanje" },
  { id: "find", label: "Traži u radu", hint: "Ctrl+F", group: "Rad" },
  { id: "locked", label: "Dodaj izvor", group: "Rad", disabled: true },
];
const SAMPLE_SHORTCUTS: ShortcutGroup[] = [
  { title: "Oblikovanje", items: [{ keys: "Ctrl+B", label: "Podebljano" }, { keys: "Ctrl+I", label: "Kurziv" }] },
  { title: "Rad", items: [{ keys: "Ctrl+F", label: "Traži u radu" }, { keys: "Ctrl+K", label: "Naredbe" }] },
];
const SAMPLE_SHORTCUT_LIST: ShortcutListGroup[] = [
  { id: "writing", title: "Pisanje", items: [{ id: "undo", label: "Poništi", keys: "Ctrl+Z" }, { id: "bold", label: "Podebljano", keys: "Ctrl+B" }] },
  { id: "view", title: "Prikaz", items: [{ id: "shortcuts", label: "Ovaj popis", keys: "Ctrl+/ ili ?" }, { id: "close", label: "Zatvara prozor ili izbornik", keys: "Esc" }] },
];
const SAMPLE_MENU: MenuEntry[] = [
  { kind: "heading", label: "Odlomak" },
  { kind: "item", id: "copy", label: "Kopiraj", hint: "Ctrl+C" },
  { kind: "item", id: "comment", label: "Dodaj komentar" },
  { kind: "item", id: "paste", label: "Zalijepi", disabled: true },
];
const FIND_LABELS: FindBarLabels = {
  search: "Traži u radu", next: "Sljedeća pojava", previous: "Prethodna pojava", close: "Zatvori traženje",
  none: "Nema pojava.", count: (position, total) => `${position} od ${total}`,
};

function PaletteExample({ commands, label }: { commands: Command[]; label: string }) {
  const [open, setOpen] = useState(false);
  const [ran, setRan] = useState("");
  return <>
    <Button aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>{label}</Button>
    <CommandPalette open={open} commands={commands} onRun={(id) => setRan(id)} onClose={() => setOpen(false)} />
    <p role="status">{ran === "" ? "" : `Pokrenuto: ${ran}`}</p>
  </>;
}

function ShortcutsExample({ groups, label }: { groups: ShortcutGroup[]; label: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>{label}</Button>
    <ShortcutsDialog open={open} groups={groups} onClose={() => setOpen(false)} />
  </>;
}

function ShortcutListExample({ groups, label }: { groups: ShortcutListGroup[]; label: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>{label}</Button>
    <ShortcutListDialog open={open} groups={groups} onClose={() => setOpen(false)} />
  </>;
}

function DrawerExample({ side }: { side: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>Otvori ladicu</Button>
    <Drawer open={open} side={side} title="Struktura rada" onClose={() => setOpen(false)}>
      <p>Uvod, Metoda, Zaključak.</p>
    </Drawer>
  </>;
}

function PopoverExample() {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return <>
    <Button ref={anchor} tone="quiet" aria-expanded={open} onClick={() => setOpen(!open)}>Pojedinosti izvora</Button>
    <Popover open={open} anchor={anchor} label="Pojedinosti izvora" onClose={() => setOpen(false)}>
      <p>Izmišljeni županijski zbornik, 2026.</p>
    </Popover>
  </>;
}

function ContextMenuExample({ entries }: { entries: MenuEntry[] }) {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [picked, setPicked] = useState("");
  return <>
    <Button aria-haspopup="menu" aria-expanded={anchor !== null} onClick={(event) => {
      const box = event.currentTarget.getBoundingClientRect();
      setAnchor({ x: box.left, y: box.bottom });
    }}>Izbornik odlomka</Button>
    <ContextMenu anchor={anchor} entries={entries} label="Izbornik odlomka"
      onSelect={(id) => { setPicked(id); setAnchor(null); }} onClose={() => setAnchor(null)} />
    <p role="status">{picked === "" ? "" : `Odabrano: ${picked}`}</p>
  </>;
}

function FindBarExample({ total, hint }: { total: number; hint?: string }) {
  const [query, setQuery] = useState(total === 0 && hint === undefined ? "" : "izmišljen");
  const [current, setCurrent] = useState(0);
  return <FindBar query={query} onQueryChange={setQuery} current={current} total={total} autoFocus={false}
    onNext={() => setCurrent((current + 1) % Math.max(total, 1))}
    onPrevious={() => setCurrent((current + Math.max(total, 1) - 1) % Math.max(total, 1))}
    onClose={nothing} labels={FIND_LABELS} />;
}

const CHECK_LABELS = { list: "Provjere prije predaje", empty: "Nema nalaza.", required: "Obavezno", advisory: "Savjet" };
const CHECK_FINDINGS = [
  { id: "f1", severity: "required" as const, title: "Izmišljeni izvor nema godinu", detail: "Dodajte godinu izdanja.", actions: [{ id: "fix", label: "Uredi izvor" }] },
  { id: "f2", severity: "advisory" as const, title: "Izmišljeni odlomak je dug", actions: [{ id: "view", label: "Prikaži" }] },
];
const ASSISTANT_LABELS = { title: "Pomoćnik", badge: "Uskoro", body: "Pomoćnik još nije dostupan u pilotu.", purposesTitle: "Za što će služiti", purposesList: "Namjene pomoćnika" };

export const ENTRIES = {
  AssistantThread: assistantThreadEntry,
  ...wizardEntries,
  ...assistantPurposeStateEntries,
  ...assistantTransferEntries,
  ...adminAiCostLimitsEntries,
  ...assistantBudgetEntries,
  ...declarationAiEntries,
  ...teacherAiAttachmentsEntries,
  ...accessDeniedEntries,
  ...practiceBadgeEntries,
  ...provenanceShareEntries,
  ...problemReportEntries,
  CheckActionList: {
    prazno: () => <CheckActionList findings={[]} labels={CHECK_LABELS} onAction={nothing} />,
    učitavanje: () => <RouteLoading label="Učitavanje provjera…" />,
    greška: () => <p role="alert">Provjere se nisu učitale.</p>,
    puno: () => <CheckActionList findings={CHECK_FINDINGS} labels={CHECK_LABELS} onAction={nothing} />,
    onemogućeno: () => <p>Provjere trenutačno nisu dostupne.</p>,
  },
  AssistantComingSoon: {
    prazno: () => <AssistantComingSoon labels={ASSISTANT_LABELS} purposes={[]} />,
    učitavanje: () => <RouteLoading label="Učitavanje pomoćnika…" />,
    greška: () => <p role="alert">Pomoćnik se nije učitao.</p>,
    puno: () => <AssistantComingSoon labels={ASSISTANT_LABELS} purposes={["Izmišljeni prijedlog 1", "Izmišljeni prijedlog 2"]} />,
    onemogućeno: () => <p>Pomoćnik trenutačno nije dostupan.</p>,
  },
  EditorToolbar: {
    prazno: () => <p>Alati se pokazuju kad je rad otvoren za uređivanje.</p>,
    učitavanje: () => <RouteLoading label="Učitavanje alata…" />,
    greška: () => <p role="alert">Alati se nisu učitali.</p>,
    puno: () => <EditorToolbar groups={EDITOR_GROUPS} />,
    onemogućeno: () => <EditorToolbar groups={EDITOR_GROUPS.map((g) => ({ ...g, actions: g.actions.map((a) => ({ ...a, disabled: true })) }))} />,
  },
  EditorOnboarding: {
    prazno: () => <p>Vodič je zatvoren.</p>,
    učitavanje: () => <RouteLoading label="Učitavanje postavke vodiča…" />,
    greška: () => <p>Vodič je dostupan iz izbornika Pomoć.</p>,
    puno: () => <EditorOnboarding locale="hr" mode="automatic" onClose={nothing} />,
    onemogućeno: () => <Button disabled>Prvi koraci</Button>,
  },
  EditorOutline: {
    prazno: () => <EditorOutline entries={[]} onSelect={nothing} />,
    učitavanje: () => <RouteLoading label="Učitavanje naslova…" />,
    greška: () => <p role="alert">Naslovi se nisu učitali.</p>,
    puno: () => <EditorOutline entries={EDITOR_HEADINGS} currentId="b" onSelect={nothing} />,
    onemogućeno: () => <p>Popis naslova trenutačno nije dostupan.</p>,
  },
  EditorProgress: {
    prazno: () => <EditorProgress words={0} range={null} />,
    učitavanje: () => <RouteLoading label="Učitavanje napretka…" />,
    greška: () => <p role="alert">Napredak se nije učitao.</p>,
    puno: () => <EditorProgress words={2100} range={{ min: 2000, max: 2500 }} />,
    onemogućeno: () => <p>Napredak trenutačno nije dostupan.</p>,
  },
  ObjectToolbar: {
    prazno: () => <p>Traka se pokazuje tek kad je odabrana tablica ili slika.</p>,
    učitavanje: () => <RouteLoading label="Učitavanje objekta…" />,
    greška: () => <p role="alert">Objekt se nije učitao.</p>,
    puno: () => toolbarPreview(TOOLBAR_ACTIONS),
    onemogućeno: () => <p>Radnje nad objektom trenutačno nisu dostupne.</p>,
  },
  PreviewDialog: {
    prazno: () => <PreviewDialogExample />,
    učitavanje: () => <RouteLoading label="Učitavanje pregleda…" />,
    greška: () => <p role="alert">Pregled se nije učitao.</p>,
    puno: () => <PreviewDialog open modal={false} kind="table" onClose={() => undefined}>
      <table><caption>Izmišljena tablica</caption><tbody><tr><th scope="row">Kompost</th><td>12 kg</td></tr></tbody></table>
    </PreviewDialog>,
    onemogućeno: () => <p>Pregled trenutačno nije dostupan.</p>,
  },
  Timeline: {
    prazno: () => <Timeline total={0} value={0} onChange={nothing} />,
    učitavanje: () => <RouteLoading label="Učitavanje koraka…" />,
    greška: () => <p role="alert">Koraci se nisu učitali.</p>,
    puno: () => <TimelineExample />,
    onemogućeno: () => <Timeline total={3} value={1} onChange={nothing} disabled />,
  },
  DiffView: {
    prazno: () => <DiffView parts={[]} />,
    učitavanje: () => <RouteLoading label="Učitavanje razlika…" />,
    greška: () => <p role="alert">Razlike se nisu učitale.</p>,
    puno: () => <DiffView parts={[
      { kind: "same", text: "Izmišljeni " },
      { kind: "removed", text: "mali " },
      { kind: "added", text: "školski " },
      { kind: "same", text: "vrt." },
    ]} />,
    onemogućeno: () => <p>Usporedba trenutačno nije dostupna.</p>,
  },
  SourceForm: {
    prazno: () => <SourceFormExample />,
    učitavanje: () => sourcePreview("učitavanje"),
    greška: () => sourcePreview("greška"),
    puno: () => sourcePreview("puno"),
    onemogućeno: () => sourcePreview("onemogućeno"),
  },
  DataTable: {
    prazno: () => workTable("Radovi", []),
    učitavanje: () => workTable("Radovi", [], true),
    greška: () => <p role="alert">Radovi se nisu učitali.</p>,
    puno: () => workTable("Radovi"),
    onemogućeno: () => <p>Popis radova trenutačno nije dostupan.</p>,
  },
  SearchableList: {
    prazno: () => <SearchableList items={[]} onSelect={nothing} />,
    učitavanje: () => <SearchableList items={[]} pending onSelect={nothing} />,
    greška: () => <SearchableList items={[]} error="Izvori se nisu učitali." onSelect={nothing} />,
    puno: () => <SearchableListExample />,
    onemogućeno: () => <SearchableList items={SAMPLE_SOURCES} disabled onSelect={nothing} />,
  },
  Fingerprint: {
    prazno: () => <p>Još nema otiska potvrde.</p>,
    učitavanje: () => <RouteLoading label="Učitavanje otiska potvrde…" />,
    greška: () => <p role="alert">Otisak potvrde se nije učitao.</p>,
    puno: () => <Fingerprint value={SAMPLE_DIGEST} />,
    onemogućeno: () => <p>Otisak potvrde trenutačno nije dostupan.</p>,
  },
  KeyValueList: {
    prazno: () => <p>Još nema podataka o potvrdi.</p>,
    učitavanje: () => <RouteLoading label="Učitavanje podataka o potvrdi…" />,
    greška: () => <p role="alert">Podaci o potvrdi nisu se učitali.</p>,
    puno: () => <KeyValueList items={[
      { id: "submitted", label: "Vrijeme predaje", value: "20. 11. 2026. u 11:00",
        details: { summary: "Vrijeme u UTC-u", children: "2026-11-20T10:00:00Z" } },
    ]} />,
    onemogućeno: () => <p>Podaci o potvrdi trenutačno nisu dostupni.</p>,
  },
  StateTag: {
    prazno: () => <StateTag state="not_submitted" />,
    učitavanje: () => <StateTag state="pending" />,
    greška: () => <StateTag state="gap" />,
    puno: () => <>{SUBMISSION_STATES.map((state) => <StateTag key={state} state={state} />)}</>,
    onemogućeno: () => <p>Stanje predaje trenutačno nije dostupno.</p>,
  },
  Steps: {
    prazno: () => <Steps currentStep={1} />,
    učitavanje: () => <RouteLoading label="Učitavanje koraka predaje…" />,
    greška: () => <><Steps currentStep={3} /><p role="alert">Korak nije dovršen.</p></>,
    puno: () => <Steps currentStep={5} />,
    onemogućeno: () => <p>Koraci predaje trenutačno nisu dostupni.</p>,
  },
  Button: {
    prazno: () => <Button tone="quiet">Odustani</Button>,
    učitavanje: () => <Button busy>Spremanje…</Button>,
    greška: () => <Button tone="quiet">Pokušajte ponovno</Button>,
    puno: () => <Button>Predaj rad</Button>,
    onemogućeno: () => <Button disabled>Predaj rad</Button>,
  },
  TextField: {
    prazno: () => <TextField label="Naslov rada" placeholder="Npr. Javne politike u lokalnoj zajednici" />,
    učitavanje: () => <TextField label="Naslov rada" busy defaultValue="" hint="Učitavanje…" />,
    greška: () => <TextField label="Naslov rada" defaultValue="" error="Upišite naslov rada." />,
    puno: () => <TextField label="Naslov rada" defaultValue="Javne politike u lokalnoj zajednici" hint="Najviše 120 znakova." />,
    onemogućeno: () => <TextField label="Naslov rada" disabled defaultValue="Javne politike u lokalnoj zajednici" />,
  },
  SaveState: {
    prazno: () => <SaveState state="EDITING" />,
    učitavanje: () => <><SaveState state="SAVING_LOCAL" /><SaveState state="SYNCING" /></>,
    greška: () => <><SaveState state="CONFLICT" /><SaveState state="ERROR" /><SaveState state="RECOVERY_REQUIRED" /></>,
    puno: () => <><SaveState state="LOCAL_DURABLE" /><SaveState state="SYNCED" /></>,
    onemogućeno: () => <SaveState state="EDITING" blocked />,
  },
  Card: {
    prazno: () => <Card title="Moji radovi" empty="Još nema radova." />,
    učitavanje: () => <Card title="Moji radovi" busy />,
    greška: () => <Card title="Moji radovi" error="Popis se nije učitao. Pokušajte ponovno." />,
    puno: () => <Card title="Seminarski rad"><p>Uvod u temu i plan poglavlja.</p></Card>,
    onemogućeno: () => <Card title="Moji radovi" disabled><p>Zadatak je zatvoren.</p></Card>,
  },
  // The toolbar icons (WEB-03) have no states of their own; each state shows
  // them in a button with its name, where one applies.
  Icon: {
    prazno: () => <Button tone="quiet"><Icon name="paragraph" /> Odlomak</Button>,
    učitavanje: () => <Button tone="quiet" busy><Icon name="undo" /> Poništi</Button>,
    greška: () => <Button tone="quiet"><Icon name="redo" /> Pokušajte ponovno</Button>,
    puno: () => <>{ICON_NAMES.map((name) => <span key={name}><Icon name={name} /> {ICON_LABELS[name]}</span>)}</>,
    onemogućeno: () => <Button tone="quiet" disabled><Icon name="bold" /> Podebljano</Button>,
  },
  // WEB-04: inline (modal={false}) so every state shows in the page flow.
  Dialog: {
    prazno: () => <Dialog open modal={false} title="Odjava" onClose={() => undefined}
      actions={<Button tone="quiet">Ostani</Button>}><p>Odjaviti se s ovog uređaja?</p></Dialog>,
    učitavanje: () => <Dialog open modal={false} title="Odjava" onClose={() => undefined} dismissible={false}
      actions={<Button busy>Odjavljivanje…</Button>}><p>Odjava je u tijeku.</p></Dialog>,
    greška: () => <Dialog open modal={false} title="Odjava" onClose={() => undefined}
      error="Odjava nije uspjela. Pokušajte ponovno." actions={<Button>Pokušajte ponovno</Button>}><p>Odjaviti se s ovog uređaja?</p></Dialog>,
    puno: () => <Dialog open modal={false} title="Odjava" onClose={() => undefined}
      actions={<><Button tone="quiet">Ostani</Button><Button>Odjavi se</Button></>}>
      <p>Rad je spremljen na poslužitelju. Nakon odjave na ovom uređaju ostaje samo ono što nije poslano.</p>
      <p>Ponovna prijava ide preko AAI@EduHr.</p></Dialog>,
    onemogućeno: () => <Dialog open modal={false} title="Odjava" onClose={() => undefined}
      actions={<Button disabled>Odjavi se</Button>}><p>Odjava trenutačno nije dostupna.</p></Dialog>,
  },
  ToastRegion: {
    prazno: () => <ToastInline toasts={[]} />,
    učitavanje: () => <ToastInline toasts={[{ id: 1, text: "Šaljem izmjene…", tone: "neutral" }]} />,
    greška: () => <ToastInline toasts={[{ id: 1, text: "Izmjena nije poslana. Pokušajte ponovno.", tone: "error" }]} />,
    puno: () => <ToastInline toasts={[1, 2, 3].map((id) => ({ id, text: `Komentar ${id} je dodan.`, tone: "neutral" as const }))} />,
    onemogućeno: () => <ToastInline toasts={[{ id: 1, text: "Obavijesti su isključene.", tone: "neutral" }]} />,
  },
  // WEB-05 form elements; invented course data only.
  Checkbox: {
    prazno: () => <Checkbox label="Pročitao sam obavijest o zadatku" />,
    učitavanje: () => <Checkbox label="Pročitao sam obavijest o zadatku" hint="Učitavanje…" aria-busy />,
    greška: () => <Checkbox label="Pročitao sam obavijest o zadatku" error="Potvrdite da ste pročitali obavijest." />,
    puno: () => <Checkbox label="Pročitao sam obavijest o zadatku" defaultChecked hint="Potvrđeno." />,
    onemogućeno: () => <Checkbox label="Pročitao sam obavijest o zadatku" disabled defaultChecked />,
  },
  Select: {
    prazno: () => <Select label="Grupa" placeholder="Odaberite grupu" options={GROUPS} />,
    učitavanje: () => <Select label="Grupa" placeholder="Odaberite grupu" options={[]} busy hint="Učitavanje…" />,
    greška: () => <Select label="Grupa" placeholder="Odaberite grupu" options={GROUPS} error="Odaberite grupu." />,
    puno: () => <Select label="Grupa" options={GROUPS} defaultValue="b" hint="Grupa B, utorkom." />,
    onemogućeno: () => <Select label="Grupa" options={GROUPS} defaultValue="a" disabled />,
  },
  TextArea: {
    prazno: () => <TextArea label="Napomena za studente" placeholder="Npr. Rad predajte do kraja tjedna" />,
    učitavanje: () => <TextArea label="Napomena za studente" busy hint="Učitavanje…" />,
    greška: () => <TextArea label="Napomena za studente" error="Napomena je preduga." defaultValue="Izmišljeni tekst napomene." />,
    puno: () => <TextArea label="Napomena za studente" defaultValue="Rad pišite u Ducturi; obavijest o zadatku vrijedi za cijelu grupu." hint="Najviše 500 znakova." />,
    onemogućeno: () => <TextArea label="Napomena za studente" disabled defaultValue="Zadatak je zatvoren." />,
  },
  Tag: {
    prazno: () => <Tag>Bez grupe</Tag>,
    učitavanje: () => <Tag>Učitavanje…</Tag>,
    greška: () => <Tag tone="warn">Rok je prošao</Tag>,
    puno: () => <><Tag>Grupa A</Tag> <Tag tone="accent">2026./2027.</Tag> <Tag tone="warn">Rok produljen</Tag></>,
    onemogućeno: () => <Tag>Zatvoreno</Tag>,
  },
  Skeleton: {
    prazno: () => <Skeleton label="Učitavanje…" lines={1} />,
    učitavanje: () => <Skeleton label="Učitavanje popisa zadataka…" />,
    greška: () => <><Skeleton label="Učitavanje…" lines={1} /><p>Popis se nije učitao. Pokušajte ponovno.</p></>,
    puno: () => <Skeleton label="Učitavanje rada…" lines={6} />,
    onemogućeno: () => <Skeleton label="Učitavanje zaustavljeno." lines={2} />,
  },
  Details: {
    prazno: () => <Details summary="Pravila zadatka"><p>Nastavnik još nije dodao pravila.</p></Details>,
    učitavanje: () => <Details summary="Pravila zadatka" open><p>Učitavanje…</p></Details>,
    greška: () => <Details summary="Pravila zadatka" open><p>Pravila se nisu učitala. Pokušajte ponovno.</p></Details>,
    puno: () => <Details summary="Pravila zadatka" open><p>Rad se piše u Ducturi. Nastavnik vidi rad dok nastaje.</p></Details>,
    onemogućeno: () => <Details summary="Pravila zadatka"><p>Zadatak je zatvoren.</p></Details>,
  },
  // WEB-06: moved from the web's shell; the web passes its own words.
  ErrorScreen: {
    prazno: () => <ErrorScreen retryLabel={t.auth.retry} homeLabel={t.auth.home} title={t.errorPage.notFoundTitle} body={t.errorPage.notFoundBody} />,
    učitavanje: () => <RouteLoading label={t.student.loading} />,
    greška: () => <ErrorScreen retryLabel={t.auth.retry} homeLabel={t.auth.home} title={t.errorPage.errorTitle} body={t.errorPage.errorBody} onRetry={() => {}} />,
    puno: () => <ErrorScreen retryLabel={t.auth.retry} homeLabel={t.auth.home} title={t.errorPage.notFoundTitle} body={t.errorPage.notFoundBody} />,
    onemogućeno: () => <ErrorScreen retryLabel={t.auth.retry} homeLabel={t.auth.home} title={t.errorPage.errorTitle} body={t.errorPage.errorBody} />,
  },
  RouteLoading: {
    prazno: () => <RouteLoading label={t.workspace.panelLoading} />,
    učitavanje: () => <RouteLoading label={t.fastPath.loading} />,
    greška: () => <RouteLoading label={t.student.loading} />,
    puno: () => <RouteLoading label={t.workspace.statusLoading} />,
    onemogućeno: () => <RouteLoading label={t.workspace.panelLoading} />,
  },
  PanelTabs: {
    prazno: () => <PanelTabs label="Ploče" tabs={[{ id: "komentari", label: "Komentari", content: <p>Još nema komentara.</p> }]} />,
    učitavanje: () => <PanelTabs label="Ploče" tabs={[{ id: "komentari", label: "Komentari", content: <p>Učitavanje…</p> }]} />,
    greška: () => <PanelTabs label="Ploče" tabs={[{ id: "izvori", label: "Izvori", content: <p>Izvori se nisu učitali. Pokušajte ponovno.</p> }]} />,
    puno: () => <PanelTabs label="Ploče" initial="izvori" tabs={[
      { id: "komentari", label: "Komentari", content: <p>Dva komentara uz odlomak 2.</p> },
      { id: "izvori", label: "Izvori", content: <p>Tri izmišljena izvora.</p> },
      { id: "pravila", label: "Pravila", content: <p>Pravila zadatka.</p> },
    ]} />,
    onemogućeno: () => <PanelTabs label="Ploče" tabs={[{ id: "pravila", label: "Pravila", content: <p>Zadatak je zatvoren.</p> }]} />,
  },
  Drawer: {
    prazno: () => <DrawerExample side="left" />,
    učitavanje: () => <Drawer open modal={false} side="left" title="Struktura rada" onClose={nothing}><p>Učitavanje…</p></Drawer>,
    greška: () => <Drawer open modal={false} side="right" title="Komentari" onClose={nothing}><p role="alert">Komentari se nisu učitali.</p></Drawer>,
    puno: () => <Drawer open modal={false} side="right" title="Struktura rada" onClose={nothing}><p>Uvod, Metoda, Zaključak.</p></Drawer>,
    onemogućeno: () => <Drawer open modal={false} side="left" title="Struktura rada" onClose={nothing}><p>Ladica trenutačno nije dostupna.</p></Drawer>,
  },
  Popover: {
    prazno: () => <PopoverExample />,
    učitavanje: () => <Popover open floating={false} anchor={{ current: null }} label="Pojedinosti izvora" onClose={nothing}><p>Učitavanje…</p></Popover>,
    greška: () => <Popover open floating={false} anchor={{ current: null }} label="Pojedinosti izvora" onClose={nothing}><p role="alert">Pojedinosti se nisu učitale.</p></Popover>,
    puno: () => <Popover open floating={false} anchor={{ current: null }} label="Pojedinosti izvora" onClose={nothing}><p>Izmišljeni županijski zbornik, 2026.</p></Popover>,
    onemogućeno: () => <Popover open floating={false} anchor={{ current: null }} label="Pojedinosti izvora" onClose={nothing}><p>Pojedinosti trenutačno nisu dostupne.</p></Popover>,
  },
  CommandPalette: {
    prazno: () => <PaletteExample commands={[]} label="Otvori naredbe (bez naredbi)" />,
    učitavanje: () => <PaletteExample commands={[{ id: "wait", label: "Učitavanje naredbi…", group: "Rad", disabled: true }]} label="Otvori naredbe (učitavanje)" />,
    greška: () => <><PaletteExample commands={[]} label="Otvori naredbe (neuspjelo)" /><p role="alert">Naredbe se nisu učitale.</p></>,
    puno: () => <PaletteExample commands={SAMPLE_COMMANDS} label="Otvori naredbe" />,
    onemogućeno: () => <PaletteExample commands={SAMPLE_COMMANDS.map((c) => ({ ...c, disabled: true }))} label="Otvori naredbe (isključene)" />,
  },
  ShortcutsDialog: {
    prazno: () => <ShortcutsExample groups={[]} label="Prikaži prečace (bez prečaca)" />,
    učitavanje: () => <><ShortcutsExample groups={[]} label="Prikaži prečace (učitavanje)" /><p>Učitavanje prečaca…</p></>,
    greška: () => <><ShortcutsExample groups={[]} label="Prikaži prečace (neuspjelo)" /><p role="alert">Prečaci se nisu učitali.</p></>,
    puno: () => <ShortcutsExample groups={SAMPLE_SHORTCUTS} label="Prikaži prečace" />,
    onemogućeno: () => <Button disabled>Prikaži prečace</Button>,
  },
  ShortcutList: {
    prazno: () => <ShortcutList groups={[]} />,
    učitavanje: () => <p role="status">Učitavanje prečaca…</p>,
    greška: () => <p role="alert">Prečaci se nisu učitali.</p>,
    puno: () => <ShortcutList groups={SAMPLE_SHORTCUT_LIST} />,
    onemogućeno: () => <ShortcutList groups={[{ id: "view", title: "Prikaz", items: [{ id: "close", label: "Zatvara prozor ili izbornik", keys: "Esc" }] }]} />,
  },
  ShortcutListDialog: {
    prazno: () => <ShortcutListExample groups={[]} label="Otvori popis prečaca (bez prečaca)" />,
    učitavanje: () => <><ShortcutListExample groups={[]} label="Otvori popis prečaca (učitavanje)" /><p>Učitavanje prečaca…</p></>,
    greška: () => <><ShortcutListExample groups={[]} label="Otvori popis prečaca (neuspjelo)" /><p role="alert">Prečaci se nisu učitali.</p></>,
    puno: () => <ShortcutListExample groups={SAMPLE_SHORTCUT_LIST} label="Otvori popis prečaca" />,
    onemogućeno: () => <Button disabled>Otvori popis prečaca</Button>,
  },
  FindBar: {
    prazno: () => <FindBarExample total={0} />,
    učitavanje: () => <><FindBarExample total={0} hint="traži" /><p>Traženje u tijeku…</p></>,
    greška: () => <FindBarExample total={0} hint="nema" />,
    puno: () => <FindBarExample total={3} />,
    onemogućeno: () => <p>Traženje trenutačno nije dostupno.</p>,
  },
  ContextMenu: {
    prazno: () => <ContextMenuExample entries={SAMPLE_MENU} />,
    učitavanje: () => <p>Izbornik se učitava…</p>,
    greška: () => <p role="alert">Izbornik se nije učitao.</p>,
    puno: () => <ContextMenuExample entries={SAMPLE_MENU} />,
    onemogućeno: () => <ContextMenuExample entries={SAMPLE_MENU.map((e) => e.kind === "item" ? { ...e, disabled: true } : e)} />,
  },
  CommentThread: {
    prazno: () => <CommentThreadExample thread={{ id: "t0", resolved: false, entries: [] }} />,
    učitavanje: () => <p>Komentari se učitavaju…</p>,
    greška: () => <p role="alert">Komentari se nisu učitali.</p>,
    puno: () => <CommentThreadExample thread={SAMPLE_THREAD} />,
    onemogućeno: () => <CommentThreadExample thread={SAMPLE_THREAD} readOnly />,
  },
  DatePicker: {
    prazno: () => <DatePickerExample value="" />,
    učitavanje: () => <p>Rok se učitava…</p>,
    greška: () => <p role="alert">Rok se nije spremio.</p>,
    puno: () => <DatePickerExample value="2026-11-05" />,
    onemogućeno: () => <DatePickerExample value="2026-11-05" disabled />,
  },
  AppointmentCalendar: {
    prazno: () => <AppointmentCalendarExample value="" appointments={[]} />,
    učitavanje: () => <p>Termini se učitavaju…</p>,
    greška: () => <p role="alert">Termini se nisu učitali.</p>,
    puno: () => <AppointmentCalendarExample value="2026-11-20T12:00" appointments={APPOINTMENTS} />,
    onemogućeno: () => <AppointmentCalendarExample value="2026-11-20T12:00" appointments={APPOINTMENTS} disabled />,
  },
} satisfies Record<string, Entry> satisfies CatalogEntries;

// WEB-1107: appointment calendar (invented moments only).
const APPOINTMENT_LABELS: AppointmentCalendarLabels = {
  calendar: "Kalendar termina", previousMonth: "Prethodni mjesec", nextMonth: "Sljedeći mjesec",
  months: ["siječanj", "veljača", "ožujak", "travanj", "svibanj", "lipanj", "srpanj", "kolovoz", "rujan", "listopad", "studeni", "prosinac"],
  weekdays: ["pon", "uto", "sri", "čet", "pet", "sub", "ned"], times: "Vrijeme", proposed: "predloženo", confirmed: "potvrđeno",
  chooseDay: "Odaberite dan", selected: (date, time) => `Odabrano: ${date} u ${time}`,
};
const APPOINTMENTS: Appointment[] = [
  { id: "t1", at: "2026-11-20T12:00", status: "proposed" },
  { id: "t2", at: "2026-11-20T14:00", status: "confirmed" },
];
function AppointmentCalendarExample({ value: initial, appointments, disabled }: { value: string; appointments: Appointment[]; disabled?: boolean }) {
  const [value, setValue] = useState(initial);
  return <AppointmentCalendar appointments={appointments} value={value} onSelect={setValue} labels={APPOINTMENT_LABELS} today="2026-11-20" disabled={disabled} />;
}

// UI-8A: comment thread and date picker (invented text only).
const THREAD_LABELS: CommentThreadLabels = {
  thread: "Komentar uz odlomak", reply: "Odgovor na komentar…", replyField: "Vaš odgovor", send: "Odgovori",
  resolve: "Označi kao riješeno", reopen: "Ponovno otvori", resolved: "Riješeno", open: "Otvoreno",
  showAll: (n) => `Prikaži sve unose (${n})`, collapse: "Sažmi",
};
const SAMPLE_THREAD: CommentThreadData = {
  id: "t1", anchor: "kućno kompostiranje", resolved: false,
  entries: [
    { id: "e1", author: "Izmišljena Mentorica", at: "12. 11. 2026.", text: "Navedi izvor za ovu tvrdnju.", mentor: true },
    { id: "e2", author: "Izmišljeni Student", at: "13. 11. 2026.", text: "Izvor je dodan u popis literature." },
  ],
};
function CommentThreadExample({ thread, readOnly }: { thread: CommentThreadData; readOnly?: boolean }) {
  const [t, setT] = useState(thread);
  return <CommentThread thread={t} labels={THREAD_LABELS} readOnly={readOnly}
    onReply={(text) => setT({ ...t, entries: [...t.entries, { id: `n${t.entries.length}`, author: "Izmišljeni Student", at: "20. 11. 2026.", text }] })}
    onResolve={() => setT({ ...t, resolved: true })} onReopen={() => setT({ ...t, resolved: false })} />;
}
const DATE_LABELS: DatePickerLabels = {
  field: "Rok za doradu", choose: "Odaberi datum", previousMonth: "Prethodni mjesec", nextMonth: "Sljedeći mjesec", invalid: "Upišite datum kao d. M. gggg.",
  months: ["siječanj", "veljača", "ožujak", "travanj", "svibanj", "lipanj", "srpanj", "kolovoz", "rujan", "listopad", "studeni", "prosinac"],
  weekdays: ["pon", "uto", "sri", "čet", "pet", "sub", "ned"],
};
function DatePickerExample({ value: initial, disabled }: { value: string; disabled?: boolean }) {
  const [value, setValue] = useState(initial);
  return <DatePicker value={value} onChange={setValue} labels={DATE_LABELS} today="2026-11-20" disabled={disabled} />;
}

// The web's own components (src/components, DAN-753), texts from locales/ only.
const SCOPE = "c2NvcGUtb2YtYW4taW52ZW50ZWQtcGVyc29u";
const work = [t.shell.nav.assignments];
const page = <p>{t.home.workBody}</p>;
// Invented courses and assignments only (as in StudentHome.test.ts). Sign-in is
// the preloader's; the catalogue only shows where the link would lead.
const signIn = (returnTo: string) => `/prijava?returnTo=${encodeURIComponent(returnTo)}`;
const courses: MyCourse[] = [
  {
    id: "00000000-0000-4000-8000-00000000000a",
    name: "Izmišljeni kolegij A",
    assignments: [
      { id: "10000000-0000-4000-8000-000000000001", title: "Izmišljeni esej", dueAt: "2026-11-30T22:59:00.000Z", noticeFirst: false },
      { id: "10000000-0000-4000-8000-000000000002", title: "Izmišljeni prikaz", dueAt: "2026-12-05T22:59:00.000Z", noticeFirst: true },
    ],
  },
  { id: "00000000-0000-4000-8000-00000000000b", name: "Izmišljeni kolegij B", assignments: [] },
];

// Invented headings (DAN-977); the long title is one unbroken word, so wrapping is tested.
let at = 0;
const heading = (level: number, text: string, number: string | null): OutlineRow =>
  ({ entry: { id: `izmisljeni-${(at += 1)}`, level, text, pos: at * 10 }, number });
const outline = [
  heading(1, "Uvod", "1"), heading(2, "Izmišljeni pojmovi", "1.1"), heading(3, "Izmišljeni pojam", "1.1.1"),
  heading(1, "Metoda", "2"), heading(2, "Izmišljeni uzorak", "2.1"),
  heading(3, "Izmišljenanajduljariječkojaseprotežepredalekoiznadširinepanelaipokazujelomljenjenaslovaugranicamaćelije", "2.1.3"),
];

/**
 * Test rig of the catalogue, not of the component (978-3): logs every
 * "Samo naslovi" report on one wrapper that never changes, so e2e can see
 * that the panel reports each press exactly once.
 */
function HeadingsProbe() {
  const [log, setLog] = useState<readonly boolean[]>([]);
  // 979-2: the browser's localStorage, read here and not at module load (states.test renders this in node).
  const [store] = useState(() => {
    try {
      return typeof window === "undefined" ? undefined : window.localStorage;
    } catch {
      return undefined;
    }
  });
  return (
    <div data-headings-log={log.join(",")}>
      <OutlinePanel rows={outline} active={2} store={store} scope="izmisljeni-dokument"
        onHeadingsOnlyChange={(on) => setLog((prev) => [...prev, on])} />
    </div>
  );
}

// Invented teacher courses (as in TeacherCourses.test.ts); each state has its own
// ids, so no heading id repeats on the page (DAN-871).
const teacherCourses = (n: number): TeacherCourse[] => [
  {
    id: `20000000-0000-4000-8000-00000000${n}0c1`, name: "Izmišljeni kolegij C", academicYear: "2026/2027", aiPolicy: "partially_allowed",
    assignments: [
      { id: `30000000-0000-4000-8000-00000000${n}0a1`, title: "Izmišljeni seminar", workType: "seminar_paper", opensAt: "2026-10-01T07:00:00.000Z", dueAt: "2026-11-30T22:59:00.000Z", currentVersion: 1, enrolledStudents: 12 },
      { id: `30000000-0000-4000-8000-00000000${n}0a2`, title: "Izmišljeni esej", workType: "essay", opensAt: "2026-10-01T07:00:00.000Z", dueAt: "2026-12-14T22:59:00.000Z", currentVersion: 2, enrolledStudents: 1 },
    ],
  },
  { id: `20000000-0000-4000-8000-00000000${n}0c2`, name: "Izmišljeni kolegij D", academicYear: "2025/2026", aiPolicy: "prohibited", assignments: [] },
];
const submission = (n: number, documentId: string | null, afterDeadline?: boolean): AssignmentSubmission => ({
  studentId: `40000000-0000-4000-8000-0000000000e${n}`, documentId, submitted: afterDeadline !== undefined,
  revision: afterDeadline === undefined ? null : 3, requestedMinute: afterDeadline === undefined ? null : "2026-11-30T21:00:00.000Z",
  afterDeadline: afterDeadline ?? null,
});
const teacherWorks = (n: number, works: AssignmentSubmission[] | null) => ({ [`30000000-0000-4000-8000-00000000${n}0a1`]: works });

// Invented mentored works (as in MentoredWorks.test.ts); the list orders them itself (DAN-871).
const mentored = (n: number, student: MentoredWork["student"], over: Partial<MentoredWork> = {}): MentoredWork => ({
  mentorshipId: `50000000-0000-4000-8000-0000000000${n}1`, assignmentId: `60000000-0000-4000-8000-0000000000${n}1`,
  documentId: `izmisljeni-rad-${n}`, student, title: `Izmišljeni naslov ${n}`, workType: "bachelor_thesis", workState: "in_progress", ...over,
});
const mentoredWorks = [
  mentored(1, { givenName: "Vesna", familyName: "Žbunić" }),
  mentored(2, { givenName: "Ante", familyName: "Čvorić" }, { workState: "submitted", workType: "master_thesis" }),
  mentored(3, { givenName: "Borna", familyName: "Crtić" }, {
    title: "Izmišljeninaslovbezrazmakakojijeduljiodretkaipokazujedaselomiunutarćelijenasvakojširini",
  }),
  mentored(4, { givenName: "Ana", familyName: "Izmišljenić" }, { documentId: null, workState: "not_started" }),
];

// Invented overview rows (as in AssignmentOverview.test.ts, WEB-33): submitted,
// after the deadline with a record gap, waiting for its receipt, and not submitted.
const overviewRow = (n: number, over: Partial<OverviewRow> = {}): OverviewRow => ({
  studentId: `70000000-0000-4000-8000-0000000000${n}1`, name: `Izmišljena Osoba ${n}`, group: "A",
  submitted: false, requestedMinute: null, afterDeadline: false, evidenceRecord: null, ...over,
});
const overviewRows = [
  overviewRow(1, { submitted: true, requestedMinute: "2026-11-20T09:05Z", afterDeadline: true, evidenceRecord: "with_gaps" }),
  overviewRow(2),
  overviewRow(3, { group: "B", submitted: true, requestedMinute: "2026-11-02T13:32Z", evidenceRecord: "continuous" }),
  overviewRow(4, { submitted: true, requestedMinute: "2026-11-14T08:00Z" }),
];

// Invented live work frame (as in LiveWorkFrame.test.ts, WEB-34); the text slot holds an invented sentence.
const liveFrame = (over: Partial<LiveWorkFrameData> = {}): LiveWorkFrameData => ({
  studentName: "Vesna Žbunić", assignmentTitle: "Izmišljeni seminar: javne politike", submitted: false,
  previousId: "izmisljeni-rad-1", nextId: "izmisljeni-rad-3", ...over,
});
const liveText = <p>Izmišljena rečenica rada koja stoji umjesto teksta uživo.</p>;

// Invented process summaries and note (as in BeforeSubmit.test.tsx, WEB-25); no real student data.
const summaryWithGap: ProcessSummaryV1 = {
  summaryFormat: "ductus-process-summary-v1",
  sessions: { evidenceKind: "observed", breakAboveMinutes: 30, count: 1,
    items: [{ from: "2026-11-10T09:00:00.000Z", to: "2026-11-10T10:00:00.000Z" }] },
  pastes: { evidenceKind: "observed", listedAboveCharacters: 200,
    listed: [{ at: { from: "2026-11-10T09:20:00.000Z", to: "2026-11-10T09:21:00.000Z" }, characters: 340, origin: "not_observed" }],
    smallerCount: 2 },
  gaps: { evidenceKind: "observed", items: [{ previousEndedAt: "2026-11-10T09:30:00.000Z", nextStartedAt: "2026-11-10T09:45:00.000Z" }] },
  recordState: "has_gaps",
};
const summaryEmpty: ProcessSummaryV1 = {
  summaryFormat: "ductus-process-summary-v1",
  sessions: { evidenceKind: "observed", breakAboveMinutes: 30, count: 0, items: [] },
  pastes: { evidenceKind: "observed", listedAboveCharacters: 200, listed: [], smallerCount: 0 },
  gaps: { evidenceKind: "observed", items: [] },
  recordState: "complete",
};
const recorded = (summary: ProcessSummaryV1): RecordedSummary => summary;
const invented: SubmissionNote = { id: "izmisljena-napomena-1", text: "Izmišljena napomena uz predaju.", createdAt: "2026-11-10T10:05:00.000000Z" };
const declaration = (over: Partial<DeclarationViewProps>) => (
  <DeclarationView recorded={{ kind: "ready", summary: recorded(summaryWithGap) }} confirmed
    onConfirm={nothing} onNext={nothing} onBack={nothing} onRetry={nothing} {...over} />
);
const beforeSubmit = (over: Partial<BeforeSubmitViewProps>) => (
  <BeforeSubmitView summary={{ kind: "ready", summary: summaryWithGap }} notes={{ kind: "ready", notes: [invented] }}
    stage={{ kind: "open" }} confirmed online onNext={nothing} onDeclaration={nothing} onBack={nothing}
    onReceipt={nothing} onRetry={nothing} onOpenNote={nothing} {...over} />
);
const topBar = (title: string | null, online: boolean) => (
  <WorkspaceTopBarView assignmentId="izmisljeni-zadatak-1" title={title} online={online} theme="light" onTheme={nothing} />
);

/** The note dialog after the given presses: its states live inside it (PD-4), so the catalogue presses its own buttons. */
function NoteProbe({ text = "", press = false, pending = false }: { text?: string; press?: boolean; pending?: boolean }) {
  const ref = (box: HTMLDivElement | null) => {
    if (box === null || box.dataset.pressed === "yes") return;
    box.dataset.pressed = "yes";
    const field = box.querySelector("textarea");
    if (field !== null && text !== "") {
      // Typed as a person would, so React sees the change (a plain value assignment it would not).
      field.focus({ preventScroll: true });
      document.execCommand("insertText", false, text);
      field.blur();
    }
    if (press) queueMicrotask(() => box.querySelector("button")?.click());
  };
  return (
    <div ref={ref}>
      <NoteDialog open modal={false} onClose={nothing} onAdded={nothing}
        onAdd={() => (pending ? new Promise(() => undefined) : Promise.resolve({ kind: "added" as const, note: invented }))} />
    </div>
  );
}

// Invented roster (WEB-31, N-04): two groups, a seminar that opens N-06, a student without a name.
type Roster = Parameters<typeof CourseStudents>[0]["result"];
const rosterStudents = [
  { studentId: "izmisljeni-student-1", name: "Vesna Žbunić", group: "A", works: [
    { assignmentId: "izmisljeni-zadatak-1", state: "predano", title: "Izmišljeni seminar", workType: "seminar_paper",
      documentId: "70000000-0000-4000-8000-000000000011" },
  ] },
  { studentId: "izmisljeni-student-2", name: "Ana Izmišljenić", group: "B", works: [
    { assignmentId: "izmisljeni-zadatak-1", state: "nakon_roka", title: "Izmišljeni seminar", workType: "seminar_paper", documentId: null },
    { assignmentId: "izmisljeni-zadatak-2", state: "ceka", title: "Izmišljeni ogled", workType: "essay" },
  ] },
  { studentId: "izmisljeni-student-3", name: null, group: "A", works: [] },
] satisfies (Roster & { kind: "ready" })["students"];
const roster = (result: Roster) => <CourseStudents result={result} />;

// Invented mentorship requests (WEB-32, N-16).
const requests: (RequestsRead & { kind: "ready" })["requests"] = [
  { requestId: "70000000-0000-4000-8000-000000000101", studentName: "Vesna Žbunić", title: "Izmišljeni završni rad", workType: "bachelor_thesis", requestedAt: "2026-11-02T09:00:00Z" },
  { requestId: "70000000-0000-4000-8000-000000000102", studentName: null, title: "Izmišljeni diplomski rad", workType: "master_thesis", requestedAt: "2026-11-05T13:30:00Z" },
];
/** The first button pressed once on mount: a state that lives inside the screen. */
const pressFirst = (box: HTMLDivElement | null) => {
  if (box === null || box.dataset.pressed === "yes") return;
  box.dataset.pressed = "yes";
  queueMicrotask(() => box.querySelector("button")?.click());
};

// Invented work on the server (WEB-26, step 4); no real student text.
const submissionStep = (over: Partial<SubmissionViewProps>) => (
  <SubmissionView work={{ kind: "ready", documentId: "70000000-0000-4000-8000-000000000021", revision: 4, nodes: [
    { type: "heading", level: 1, children: [{ text: "Uvod", marks: [] }] },
    { type: "paragraph", children: [{ text: "Izmišljena rečenica rada, ", marks: [] }, { text: "s naglaskom", marks: ["italic"] }, { text: ".", marks: [] }] },
    { type: "bulletItem", children: [{ text: "Izmišljena prva točka", marks: [] }] },
    { type: "bulletItem", children: [{ text: "Izmišljena druga točka", marks: [] }] },
  ] }} stage={{ kind: "open" }} confirmed online sending={false} checking={false} next={null}
    onOpen={nothing} onCheck={nothing} onReload={nothing} onDeclaration={nothing} onBack={nothing} {...over} />
);

// Invented signed receipt (as in ReceiptPanel.test.tsx, WEB-27); no real identifier or key.
const signedReceipt: SubmissionReceipt = {
  payload: {
    receiptSchema: "ductus-submission-receipt-v2",
    submissionId: "11111111-1111-4111-8111-111111111111",
    evidenceDomainId: "22222222-2222-4222-8222-222222222222",
    principalId: "33333333-3333-4333-8333-333333333333",
    assignmentId: "44444444-4444-4444-8444-444444444444",
    assignmentVersion: 2,
    documentId: "doc-izmisljeni-1",
    evidencePackageId: "pkg-izmisljeni-1",
    revision: 7,
    artifactSha256: "0123456789abcdef".repeat(4),
    evidenceHeadSegmentHash: "f".repeat(64),
    evidenceRecord: "continuous",
    requestedAt: "2026-11-19T13:05:00.000000Z",
    dueAt: "2026-11-20T22:59:00.000000Z",
    afterDeadline: false,
    signedAt: "2026-11-19T13:05:01.000000Z",
  },
  payloadDigestSha256: "e".repeat(64),
  signature: { algorithm: "Ed25519", keyId: "kljuc-izmisljeni", keyVersion: "1", signatureEncoding: "raw", signatureBase64Url: "A".repeat(86) },
};
const receiptPanel = (read: ReceiptRead) => (
  <ReceiptPanel read={read} retryHref="/rad/izmisljeni/predaja/potvrda" summaryHref="/rad/izmisljeni/predaja/pregled"
    submitHref="/rad/izmisljeni/predaja" />
);
const verificationCode = { receiptId: signedReceipt.payload.submissionId, fingerprint: signedReceipt.payload.artifactSha256 };

// WEB-1106: proofs from a source. Invented sources; the page is drawn here, nothing is read or sent.
const PROOF_WORK = "11111111-1111-4111-8111-111111111111";
const PROOF_S1 = "22222222-2222-4222-8222-222222222222";
const PROOF_S2 = "44444444-4444-4444-8444-444444444444";
const proofPage: ProofPicture = {
  width: 600, height: 400,
  draw: (ctx, from, to) => {
    const sx = to.width / from.width;
    const sy = to.height / from.height;
    ctx.save();
    ctx.setTransform(sx, 0, 0, sy, to.x - from.x * sx, to.y - from.y * sy);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = "#8c887f";
    for (let y = 40; y < 380; y += 26) ctx.fillRect(40, y, y % 4 === 0 ? 420 : 520, 8);
    ctx.restore();
  },
};
const sampleProof = (id: string, sourceId: string, page: string, note: string | null = null): SourceProof => ({
  id, sourceId, page, note, createdAt: "2026-11-20T10:15:00.000Z", size: 24000,
  imagePath: `${proofsPath(PROOF_WORK, sourceId) ?? ""}/${id}/image`,
});
const proofSources = [{ id: PROOF_S1, label: "Izmišljenić (2020)" }, { id: PROOF_S2, label: "Primjerić i Uzorak (2019)" }];
const proofCitations = [{ sourceId: PROOF_S1, page: "14" }, { sourceId: PROOF_S1, page: "20" }, { sourceId: PROOF_S2, page: null }];
const proofLists: Record<string, ProofsRead> = {
  [PROOF_S1]: { kind: "ok", proofs: [sampleProof("55555555-5555-4555-8555-555555555555", PROOF_S1, "14", "Uvodni odlomak")] },
  [PROOF_S2]: { kind: "ok", proofs: [] },
};
const proofDeps = (list: (sourceId: string) => Promise<ProofsRead>): ProofsDeps => ({
  assignmentId: PROOF_WORK, list,
  upload: async () => ({ kind: "nepoznato" }),
  picture: async () => proofPage,
  openPdf: async () => { throw new Error("katalog ne otvara PDF"); },
});
const proofsPanel = (editable: boolean, list: (sourceId: string) => Promise<ProofsRead>, sources = proofSources) =>
  <SourceProofsPanel sources={sources} citations={sources.length ? proofCitations : []} editable={editable} deps={proofDeps(list)} />;
const proofCapture = (over: Partial<Capture>): Capture => ({
  ...startCapture(PROOF_S1, "Izmišljenić (2020)"), picture: proofPage, ...over,
});
const proofDialog = (state: Capture) => <ProofDialog state={state} dispatch={nothing} onSave={nothing} onCancel={nothing} modal={false} />;
const proofFrame = { x: 40, y: 60, width: 420, height: 110 };

export const SCREEN_ENTRIES = {
  AppShell: {
    prazno: () => <AppShell navId="bocna-navigacija-1" role={null} scope={null} crumbs={[]} ownMain>{page}</AppShell>,
    učitavanje: () => <AppShell navId="bocna-navigacija-2" role="student" scope={SCOPE} current="/zadaci" crumbs={work} ownMain><p role="status">{t.student.loading}</p></AppShell>,
    greška: () => <AppShell navId="bocna-navigacija-3" role="student" scope={SCOPE} current="/zadaci" crumbs={work} ownMain><p role="alert">{t.errorPage.errorBody}</p></AppShell>,
    puno: () => <AppShell navId="bocna-navigacija-4" role="student" scope={SCOPE} current="/zadaci" crumbs={work} ownMain>{page}</AppShell>,
    onemogućeno: () => <AppShell navId="bocna-navigacija-5" role={null} scope={SCOPE} crumbs={[]} ownMain>{page}</AppShell>,
  },
  StudentHome: {
    prazno: () => <StudentHome read={{ kind: "ready", courses: [] }} enroll={null} signIn={signIn} />,
    učitavanje: () => <RouteLoading label={t.workspace.panelLoading} />,
    greška: () => <StudentHome read={{ kind: "unavailable" }} enroll={null} signIn={signIn} />,
    puno: () => <StudentHome read={{ kind: "ready", courses }} enroll={null} signIn={signIn} />,
    onemogućeno: () => <StudentHome read={{ kind: "signedOut" }} enroll={null} signIn={signIn} />,
  },
  MyAssignments: {
    prazno: () => <MyAssignments courses={[{ ...courses[1]!, assignments: [] }]} />,
    učitavanje: () => <RouteLoading label={t.workspace.panelLoading} />,
    greška: () => <StudentHome read={{ kind: "unavailable" }} enroll={null} signIn={signIn} view="courses" />,
    puno: () => <MyAssignments courses={courses} />,
    onemogućeno: () => <MyAssignments courses={courses} level={2} />,
  },
  EmptyHome: {
    prazno: () => <EmptyHome enroll={null} />,
    učitavanje: () => <RouteLoading label={t.workspace.panelLoading} />,
    greška: () => <StudentHome read={{ kind: "unavailable" }} enroll={null} signIn={signIn} />,
    puno: () => <EmptyHome enroll={null} />,
    onemogućeno: () => <EmptyHome enroll={null} />,
  },
  OutlinePanel: {
    prazno: () => <OutlinePanel rows={[]} active={-1} />,
    učitavanje: () => <RouteLoading label={t.workspace.panelLoading} />,
    greška: () => <OutlinePanel rows={[heading(0, "Nula", "0"), heading(1, "", "1"), heading(4, "Četiri", "1.0.0.1")]} active={-1} />,
    puno: () => <HeadingsProbe />,
    // No numbers; branch "2" collapsed (977-3), searched for "uzorak" (978-1): "2" and "2.1" show open,
    // and the active 2.1.3, not a hit, gives its mark to "2.1".
    onemogućeno: () => <OutlinePanel rows={outline.map((r) => ({ ...r, number: null }))} collapsed={[3]} active={5} query="uzorak" headingsOnly />,
  },
  TeacherCourses: {
    prazno: () => <TeacherCourses courses={[]} />,
    učitavanje: () => <RouteLoading label={t.workspace.panelLoading} />,
    greška: () => <TeacherCourses courses={teacherCourses(3)} works={teacherWorks(3, null)} />,
    puno: () => (
      <TeacherCourses
        courses={teacherCourses(4)}
        works={teacherWorks(4, [submission(1, "izmisljeni-rad-1", false), submission(2, "izmisljeni-rad-2"), submission(3, "izmisljeni-rad-3", true)])}
        accommodations={{ "30000000-0000-4000-8000-0000000040a1": ["40000000-0000-4000-8000-0000000000e2"] }}
      />
    ),
    onemogućeno: () => <TeacherCourses courses={teacherCourses(5)} works={teacherWorks(5, [submission(1, null)])} />,
  },
  AssignmentOverview: {
    prazno: () => <AssignmentOverview assignmentTitle="Izmišljeni seminar" rows={[]} />,
    učitavanje: () => <AssignmentOverview assignmentTitle="Izmišljeni seminar" rows={null} loading />,
    greška: () => <AssignmentOverview assignmentTitle="Izmišljeni seminar" rows={null} retryHref="/nastavnik/zbirni" />,
    puno: () => <AssignmentOverview assignmentTitle="Izmišljeni seminar" rows={overviewRows} />,
    // Names the server does not have: shown as missing, never as a stand-in.
    onemogućeno: () => <AssignmentOverview assignmentTitle="Izmišljeni esej" rows={[overviewRow(5, { name: null, group: null })]} />,
  },
  MentoredWorks: {
    prazno: () => <MentoredWorks works={[]} />,
    učitavanje: () => <RouteLoading label={t.workspace.panelLoading} />,
    greška: () => <MentoredWorks works={[mentored(5, null, { documentId: null, workState: "not_started" })]} />,
    puno: () => <MentoredWorks works={mentoredWorks} />,
    onemogućeno: () => <MentoredWorks works={[mentored(6, { givenName: "Iva", familyName: "Izmišljenić" }, { documentId: null, workState: "not_started", workType: "doctoral_thesis" })]} />,
  },
  LiveWorkFrame: {
    prazno: () => <LiveWorkFrame documentId="izmisljeni-rad-2" frame={null} recordState={null} text={<p role="status">{t.workspace.panelLoading}</p>} />,
    učitavanje: () => <RouteLoading label={t.workspace.panelLoading} />,
    greška: () => <LiveWorkFrame documentId="izmisljeni-rad-2" frame={null} recordState={null} text={<p role="alert">{t.errorPage.errorBody}</p>} />,
    puno: () => <LiveWorkFrame documentId="izmisljeni-rad-2" frame={liveFrame()} recordState="has_gaps" text={liveText} />,
    onemogućeno: () => <LiveWorkFrame documentId="izmisljeni-rad-2" frame={liveFrame({ submitted: true, previousId: null, nextId: null })} recordState="complete" text={liveText} />,
  },
  // WEB-23 (S: E-7): the bar has no error of its own; a title the read could not give shows the generic one.
  WorkspaceTopBar: {
    prazno: () => topBar(null, true),
    učitavanje: () => <RouteLoading label={t.workspace.panelLoading} />,
    greška: () => <div>{topBar(null, true)}<p role="alert">{t.errorPage.errorBody}</p></div>,
    puno: () => topBar("Izmišljeni seminar: javne politike", true),
    onemogućeno: () => topBar("Izmišljeni seminar: javne politike", false),
  },
  // WEB-24 (S: E-9): the declaration step as DeclarationView draws it; the page adds only the router.
  Declaration: {
    prazno: () => declaration({ recorded: { kind: "ready", summary: recorded(summaryEmpty) }, confirmed: false }),
    učitavanje: () => declaration({ recorded: { kind: "loading" }, confirmed: false }),
    greška: () => declaration({ recorded: { kind: "error" }, confirmed: false }),
    puno: () => declaration({}),
    onemogućeno: () => declaration({ confirmed: false }),
  },
  // WEB-25 (S: E-8): the step before submitting as BeforeSubmitView draws it.
  BeforeSubmit: {
    prazno: () => beforeSubmit({ summary: { kind: "ready", summary: summaryEmpty }, notes: { kind: "ready", notes: [] } }),
    učitavanje: () => beforeSubmit({ summary: { kind: "loading" }, notes: { kind: "loading" } }),
    greška: () => beforeSubmit({ summary: { kind: "error" }, notes: { kind: "unavailable" } }),
    puno: () => beforeSubmit({}),
    onemogućeno: () => beforeSubmit({ online: false }),
  },
  // PD-4: empty, a press on "Dodaj" with nothing written, a written note, and a note on its way (nothing answers).
  NoteDialog: {
    prazno: () => <NoteProbe />,
    učitavanje: () => <RouteLoading label={t.workspace.panelLoading} />,
    greška: () => <NoteProbe press />,
    puno: () => <NoteProbe text="Izmišljena napomena uz predaju." />,
    onemogućeno: () => <NoteProbe text="Izmišljena napomena uz predaju." press pending />,
  },
  // WEB-31 (N-04): "onemogućeno" is a roster with no work to open (an essay, a seminar without a document).
  CourseStudents: {
    prazno: () => roster({ kind: "ready", students: [], courseName: "Izmišljeni kolegij" }),
    učitavanje: () => roster({ kind: "loading" }),
    greška: () => roster({ kind: "unavailable", retryHref: "/nastavnik/kolegiji" }),
    puno: () => roster({ kind: "ready", students: rosterStudents, courseName: "Izmišljeni kolegij" }),
    onemogućeno: () => roster({ kind: "ready", students: rosterStudents.slice(1) }),
  },
  // WEB-32 (N-16): "onemogućeno" is a decision on its way (nothing answers): the other request waits.
  MentorshipRequests: {
    prazno: () => <MentorshipRequests read={{ kind: "ready", requests: [] }} here="/nastavnik/mentorstva" />,
    učitavanje: () => <RouteLoading label={t.workspace.panelLoading} />,
    greška: () => <MentorshipRequests read={{ kind: "unavailable" }} here="/nastavnik/mentorstva" />,
    puno: () => <MentorshipRequests read={{ kind: "ready", requests }} here="/nastavnik/mentorstva" />,
    onemogućeno: () => (
      <div ref={pressFirst}>
        <MentorshipRequestsView read={{ kind: "ready", requests }} here="/nastavnik/mentorstva" call={() => new Promise(() => undefined)} />
      </div>
    ),
  },
  // WEB-26 (PD-3): a failed submission is told by the page, never by the dialog, so greška is the
  // dialog asked again after the page's alert; onemogućeno is the submission on its way.
  SubmitDialog: {
    prazno: () => <SubmitDialog open modal={false} revision={1} late={false} sending={false} onSubmit={nothing} onClose={nothing} />,
    učitavanje: () => <RouteLoading label={t.workspace.panelLoading} />,
    greška: () => (
      <div>
        <p role="alert">{t.errorPage.errorBody}</p>
        <SubmitDialog open modal={false} revision={4} late={false} sending={false} onSubmit={nothing} onClose={nothing} />
      </div>
    ),
    puno: () => <SubmitDialog open modal={false} revision={4} late sending={false} onSubmit={nothing} onClose={nothing} />,
    onemogućeno: () => <SubmitDialog open modal={false} revision={4} late={false} sending onSubmit={nothing} onClose={nothing} />,
  },
  // WEB-26 (step 4): the work as the server holds it, sent only from here.
  SubmissionView: {
    prazno: () => submissionStep({ work: { kind: "empty" } }),
    učitavanje: () => submissionStep({ work: { kind: "loading" } }),
    greška: () => submissionStep({ work: { kind: "unavailable" } }),
    puno: () => submissionStep({}),
    onemogućeno: () => submissionStep({ online: false }),
  },
  // WEB-27 (S: E-11): "onemogućeno" is a submission recorded and waiting for its signature, never "predano".
  ReceiptPanel: {
    prazno: () => receiptPanel({ kind: "none" }),
    učitavanje: () => receiptPanel({ kind: "loading" }),
    greška: () => receiptPanel({ kind: "error" }),
    puno: () => receiptPanel({ kind: "potvrdeno", receipt: signedReceipt }),
    onemogućeno: () => receiptPanel({ kind: "ceka", revision: 7, requestedAt: "2026-11-19T13:05:00.000000Z" }),
  },
  // WEB-1220: "učitavanje" is the share still being computed ("pending"); the view's own
  // "loading" belongs to the screen, which reads before it renders.
  ProvenancePanel: {
    prazno: () => <ProvenancePanel read={{ kind: "none" }} />,
    učitavanje: () => <ProvenancePanel read={{ kind: "pending" }} />,
    greška: () => <ProvenancePanel read={{ kind: "error" }} />,
    puno: () => <ProvenancePanel read={VECTOR_9_1} />,
    onemogućeno: () => <ProvenancePanel read={{ kind: "disabled" }} />,
  },
  VerificationForm: {
    prazno: () => <VerificationForm state={{ kind: "idle" }} onChange={nothing} onVerify={nothing} />,
    učitavanje: () => <VerificationForm code={verificationCode} state={{ kind: "pending" }} onVerify={nothing} />,
    greška: () => <VerificationForm code={verificationCode} state={{ kind: "unavailable" }} onChange={nothing} onVerify={nothing} />,
    puno: () => <VerificationForm code={verificationCode} state={{
      kind: "matched",
      submittedAt: "2026-11-20T10:15:30.123456Z",
      signedAt: "2026-11-20T10:15:31.654321Z",
      keyId: "izmisljeni-kljuc-potvrde",
    }} onChange={nothing} onVerify={nothing} />,
    onemogućeno: () => <VerificationForm code={verificationCode} state={{ kind: "rateLimited" }} />,
  },
  SourceProofsPanel: {
    prazno: () => proofsPanel(true, async () => ({ kind: "ok", proofs: [] }), []),
    učitavanje: () => proofsPanel(true, () => new Promise(() => undefined)),
    greška: () => proofsPanel(true, async () => ({ kind: "nepoznato" })),
    puno: () => proofsPanel(true, async (sourceId) => proofLists[sourceId] ?? { kind: "nepoznato" }),
    onemogućeno: () => proofsPanel(false, async (sourceId) => proofLists[sourceId] ?? { kind: "nepoznato" }),
  },
  ProofDialog: {
    prazno: () => proofDialog(proofCapture({})),
    učitavanje: () => proofDialog(proofCapture({ selection: proofFrame, page: "14", status: "sending", tried: true })),
    greška: () => proofDialog(proofCapture({ selection: proofFrame, page: "14", note: "Uvodni odlomak", status: "failed", tried: true })),
    puno: () => proofDialog(proofCapture({
      selection: proofFrame, page: "14", note: "Uvodni odlomak", quote: "kućno kompostiranje znatno smanjuje otpad",
      pdf: { page: 3, count: 12, loading: false }, notice: { kind: "differs", near: "kućno kompostiranje smanjuje otpad", missing: ["znatno"] },
    })),
    onemogućeno: () => proofDialog(proofCapture({ pdf: { page: 1, count: 12, loading: true }, notice: { kind: "pdfOpening" } })),
  },
} satisfies Record<string, Entry> satisfies CatalogEntries;
