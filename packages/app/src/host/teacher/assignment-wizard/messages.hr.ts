// WEB-1801 (M8.2b): the teacher's switch "Dopušten uvoz" in the assignment wizard.
export const importAllowedHr = {
  label: "Dopušten uvoz",
  hint: "Student smije uvesti postojeći tekst iz DOCX ili PDF datoteke. Prije umetanja vidi pregled i potvrđuje uvoz; uvezeni tekst ostaje označen kao uvezen. Kasnije se uvoz u novoj verziji zadatka smije samo isključiti.",
  off: "Uvoz nije dopušten: student ne vidi gumb za uvoz.",
} as const;

// WEB-1403: the generic wizard's labels and per-step checks for "Novi zadatak".
export const wizardHr = {
  labels: { steps: "Koraci izrade zadatka", next: "Nastavi", back: "Natrag" },
  steps: { basics: "Osnovno", schedule: "Rok i opseg", help: "Pomoć", recorded: "Što se bilježi", review: "Pregled i objava" },
  errors: {
    title: "Upišite naslov zadatka do 160 znakova.",
    instructions: "Opis zadatka smije imati najviše 20 000 znakova.",
    opensAt: "Odaberite početak zadatka.",
    dueAt: "Odaberite rok zadatka.",
    dueBeforeOpen: "Rok mora biti nakon početka zadatka.",
    words: "Upišite cijele brojeve; najmanji broj riječi ne smije biti veći od najvećeg.",
  },
  reviewHeading: "Pregled",
  fieldsLabel: { title: "Naslov", due: "Rok", opens: "Početak", words: "Opseg", help: "Pomoć", kind: "Vrsta" },
  practice: {
    label: "Probni zadatak (bez ocjene)",
    hint: "Student i nastavnik vide oznaku „Probni”. Probni zadatak nema polje ocjene.",
    off: "Zadatak se vrednuje kao i obično.",
  },
  helpOn: "Prema pravilima kolegija",
  practiceOn: "Probni zadatak, bez ocjene",
  practiceOff: "Redovni zadatak",
  helpOff: "Bez AI pomoći",
} as const;
