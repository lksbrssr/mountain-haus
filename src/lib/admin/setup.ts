// Move-in / change-of-owner to-dos for a house in Bayrischzell (Lkr. Miesbach).
// These are the one-time registrations you work through after an Eigentümer-
// wechsel. Flip `done` to true as you knock them out. Not legal advice —
// confirm specifics with the Gemeinde / your Notar.

export type SetupPriority = "now" | "soon" | "later";

export type SetupTask = {
  id: string;
  title: string;
  priority: SetupPriority;
  where: string; // who to contact / where to do it
  done: boolean;
  detail: string;
};

export const setupTasks: SetupTask[] = [
  {
    id: "strom",
    title: "Strom anmelden (Eigentümerwechsel)",
    priority: "now",
    where: "Stromversorger / Grundversorger Lkr. Miesbach",
    done: false,
    detail:
      "Mit Zählerstand (4.434 kWh) und Zählernummer (1645 774 X 4717 0129) den Anbieter informieren. Entweder bestehenden Vertrag übernehmen oder neuen Anbieter wählen — sonst läuft man automatisch beim örtlichen Grundversorger. Innerhalb von ~2 Wochen melden.",
  },
  {
    id: "wasser",
    title: "Wasser & Abwasser ummelden",
    priority: "now",
    where: "Gemeinde Bayrischzell / Wasserversorgung",
    done: false,
    detail:
      "Eigentümerwechsel bei der gemeindlichen Wasserver- und Abwasserentsorgung melden. Zählerstand Wasser beim Ablesen notieren (im Übergabeprotokoll nicht erfasst — selbst ablesen). Gebührenbescheid läuft künftig auf den neuen Eigentümer.",
  },
  {
    id: "muell",
    title: "Müllabfuhr / Abfallgebühren anmelden",
    priority: "now",
    where: "Kommunalunternehmen Abfallwirtschaft Lkr. Miesbach (KU)",
    done: false,
    detail:
      "Rest-, Bio-, Papier- und Gelbe Tonne auf den neuen Eigentümer ummelden und Tonnengrößen/Leerungsrhythmus bestätigen. Abfallgebühren laufen über den Landkreis. Wertstoffhof-Zugang klären (Ansprechpartner vor Ort: Hr. Lill, 0174 7056688).",
  },
  {
    id: "schornsteinfeger",
    title: "Schornsteinfeger / Kaminkehrer melden",
    priority: "now",
    where: "Bezirkskaminkehrer Ralf Krieglmeier · 08666 228057 / 0176 20236576",
    done: false,
    detail:
      "Eigentümerwechsel beim zuständigen Bezirksschornsteinfeger (Kehrbezirk) anmelden. Pflicht: Feuerstättenschau und wiederkehrende Abgasmessung/Kehrung für die Heizung (Brötje) und ggf. Kaminofen. Er führt das Kehrbuch und setzt die Termine.",
  },
  {
    id: "fluessiggas",
    title: "Flüssiggas-Lieferkonto einrichten",
    priority: "now",
    where: "Gloria-Gas (089 87181111) oder H+H Flüssiggas (0821 2678926)",
    done: false,
    detail:
      "Der Tank ist Eigentum (Eigentumsnachweis SANO-Propan 1997) — keine Miete, freie Lieferantenwahl. Konto beim Lieferanten auf den neuen Eigentümer anlegen und die gesetzlichen Tankprüfungen (ÄP 2026, IP 2030) dort anmelden.",
  },
  {
    id: "grundsteuer",
    title: "Grundsteuer ummelden",
    priority: "soon",
    where: "Finanzamt Miesbach / Gemeinde Bayrischzell",
    done: false,
    detail:
      "Nach Grundbucheintrag läuft die Grundsteuer auf den neuen Eigentümer über. Grundsteuerbescheid der Gemeinde prüfen; bei Änderungen Grundsteuererklärung ans Finanzamt.",
  },
  {
    id: "gebaeudeversicherung",
    title: "Wohngebäudeversicherung regeln",
    priority: "soon",
    where: "Eigene Versicherung / Vorversicherer",
    done: false,
    detail:
      "Die bestehende Wohngebäudeversicherung geht per Gesetz auf den Käufer über (§ 95 VVG). Sonderkündigungsrecht innerhalb 1 Monat nach Grundbucheintrag — eigene Police inkl. Elementarschäden (Hochwasser/Lawine/Starkregen, in Alpenlage wichtig) abschließen. Dazu Hausratversicherung.",
  },
  {
    id: "rundfunk",
    title: "Rundfunkbeitrag klären",
    priority: "soon",
    where: "rundfunkbeitrag.de",
    done: false,
    detail:
      "Als Zweitwohnung ggf. Befreiung möglich, wenn der Hauptwohnsitz (München) bereits zahlt — Antrag auf Zweitwohnungsbefreiung stellen. Sonst Wohnung anmelden.",
  },
  {
    id: "zweitwohnsitz",
    title: "Zweitwohnsitz & Zweitwohnungsteuer prüfen",
    priority: "soon",
    where: "Gemeinde Bayrischzell (Einwohnermeldeamt)",
    done: false,
    detail:
      "Falls als Zweitwohnsitz genutzt: beim Einwohnermeldeamt anmelden. Prüfen, ob Bayrischzell eine Zweitwohnungsteuer erhebt (touristische Gemeinde — gut möglich).",
  },
  {
    id: "kurbeitrag",
    title: "Kur-/Fremdenverkehrsbeitrag prüfen",
    priority: "later",
    where: "Kurverwaltung / Tourist-Info Bayrischzell",
    done: false,
    detail:
      "Bayrischzell ist Kurort. Für Zweitwohnungsinhaber kann ein Kur-/Gästebeitrag anfallen (bringt i. d. R. die GästeCard mit Bergbahn-/ÖPNV-Vorteilen). Bei der Kurverwaltung anmelden.",
  },
  {
    id: "internet",
    title: "Internet / Telefon einrichten",
    priority: "later",
    where: "Telekom / regionaler Anbieter",
    done: false,
    detail:
      "Verfügbarkeit am Standort prüfen und Anschluss bestellen. Ländliche Lage — ggf. begrenzte Bandbreite, Alternativen (Kabel/Funk/Starlink) prüfen.",
  },
  {
    id: "wifi",
    title: "WLAN-Daten im Gäste-Bereich eintragen",
    priority: "later",
    where: "src/lib/info.ts",
    done: false,
    detail:
      "Sobald der Anschluss steht: WLAN-Name und Passwort in info.ts aktualisieren, damit der Gäste-Bereich stimmt.",
  },
];

export const priorityLabel: Record<SetupPriority, string> = {
  now: "Zuerst",
  soon: "Bald",
  later: "Später",
};
