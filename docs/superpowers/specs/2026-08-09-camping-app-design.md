# Spec: Camping-Packlisten-App „Roßmühle"

Datum: 2026-08-09
Status: Vom Nutzer fachlich abgenommen (09.08.2026)

## 1. Ziel

Web-App für eine feste Freundesgruppe, die jährlich gemeinsam an der Roßmühle an der Saale campen geht. Kern: eine gemeinsame, live synchronisierte Packliste pro Trip. Primär mobile Nutzung (PWA), Desktop sekundär.

## 2. Kernentscheidungen (mit Nutzer abgestimmt)

| Thema | Entscheidung |
|---|---|
| Backend | InstantDB (Free Tier, 0 €) – Live-Sync, Auth, Chat in einem |
| Datenhaltung | Von Anfang an geteilte Cloud-Daten (kein reiner localStorage) |
| Auth | Echtes Login per E-Mail Magic Code (InstantDB Auth, passwortlos) |
| Item-Logik | „Bedarf + Zusagen": Item wird als Bedarf angelegt, Nutzer tragen sich als Mitbringer ein |
| Rechte | Jeder eingeloggte Nutzer darf anlegen/zusagen/kommentieren. Items löschen/bearbeiten: nur Ersteller |
| Sprache | Deutsch |
| Design | Anlehnung an 7 Referenz-Screens (siehe `design-references/`), umgefärbt auf Camping/Natur |

## 3. Tech-Stack

- **Framework:** SvelteKit mit Svelte 5 (Runes), TypeScript
- **Styling:** Tailwind CSS 4
- **Backend:** InstantDB (`@instantdb/react`) – Datenbank, Auth (Magic Code), Realtime-Sync, Presence
- **PWA:** Service Worker (SvelteKit-`$service-worker`), Web-App-Manifest, Homescreen-Icon
- **Hosting:** Vercel oder Cloudflare Pages (0 €), InstantDB Cloud (0 €)
- **Emoji/Kategorien:** Lokales deutsches Keyword-Mapping (kein externer KI-Service, offline-fähig, erweiterbar), manueller Override möglich

Begründung Stack: SvelteKit = kleinstes Bundle (~30–45 KB) und schnellste Time-to-Interactive auf Mobilgeräten; InstantDB deckt Auth + Realtime + Chat ohne eigenen Server ab; Keyword-Mapping statt LLM, weil kostenlos, sofort, offline, deterministisch.

## 4. Datenmodell (InstantDB Schema)

- **profiles** – Verknüpfung zu `$users`; Felder: `name`, `avatarColor`/`emoji`
- **trips** – `name`, `year` (number), `location`, `startDate?`, `endDate?`, `createdBy` → profile, `createdAt`
- **items** – `trip` → trips, `name`, `emoji` (string), `category` (string, aus festem Set), `neededCount` (number, default 1), `createdBy` → profile, `createdAt`, `done?` (nicht nötig – Status ergibt sich aus Zusagen)
- **claims** (Zusagen) – `item` → items, `user` → profile, `count` (number, default 1), `createdAt`; Unique: (item, user)
- **comments** – `item` → items, `user` → profile, `text`, `createdAt`

Abgeleiteter Item-Status (im Client berechnet):
- ⚠️ **offen** – keine Zusage
- 🟡 **teilweise** – Summe claims < neededCount
- ✅ **versorgt** – Summe claims ≥ neededCount

## 5. Features

### 5.1 Trips
- Trip-Übersicht beim Start (Liste aller Trips, kommende zuerst)
- Trip anlegen: Name, Jahr, Ort, optional Zeitraum
- Aktiven Trip wählen → führt zur Packliste
- Mehrere Trips parallel möglich

### 5.2 Packliste (Herzstück)
Zeilenlayout pro Item:
- Emoji + Item-Name
- Avatar-/Initialen-Badges der Zusager
- Status-Punkt (⚠️/🟡/✅)
- 💬-Indikator mit Kommentar-Anzahl (nur wenn > 0)

Ansichten (Toggle in der Toolbar):
1. **Kompakte Liste** – flach, sortiert: offene zuerst, dann alphabetisch
2. **Kategorieansicht** – gruppiert nach Kategorien (Küche, Schlafen, Shelter, Verpflegung, Sonstiges), Kategorien mit Sektions-Header

Filter-Chips: „Alle" / „Noch offen" / „Meine Zusagen"

Neues Item: FAB (Glut-Orange) → Bottom Sheet → Name tippen → Emoji+Kategorie werden live vorgeschlagen (editierbar) → Speichern. Minimaler Aufwand, mobil einhändig bedienbar.

### 5.3 Item-Detail
Bottom Sheet (mobil) bzw. Dialog (Desktop):
- Wer bringt mit: Liste der Zusager mit Anzahl
- „Bring ich mit"-Button (Toggle; eigene Zusage entfernbar)
- Benötigte Anzahl editierbar (nur Ersteller)
- Kommentar-Chat darunter (Realtime), eigene Nachrichten löschbar
- Emoji/Kategorie-Override (nur Ersteller)

### 5.4 Emoji & Kategorie (revidiert nach Nutzer-Test)
Keine Auto-Erkennung – hat sich nicht bewährt. Stattdessen:
- **Kategorien (fest, Pflicht beim Anlegen):** Küche 🍳 · Wohnen ⛺ · Spiel & Spaß 🎲 · Sonstiges 🎒
- **Emoji:** Nutzer wählt selbst aus großem Picker-Grid (~100 Camping-relevante Emojis) oder tippt ein beliebiges Emoji über die System-Tastatur. Default: 🎒
- Override im Detail-Dialog (nur Ersteller)

### 5.5 Dark Mode
- Light Mode ist Standard
- Optionaler Dark Mode: Toggle in den Einstellungen + Respektieren der System-Einstellung beim ersten Start
- Dark Mode als vollwertiges, eigenes Farbsystem (kein automatisches Invertieren)

## 6. Design-System

Referenz: 7 Screens in `design-references/` (Rituals-/Editorial-Stil).

- **Typografie:**
  - Display: Serif-Italic (z. B. „Editorial New"-Alternative: *Newsreader* oder *Fraunces* Italic) für Headlines, sparsam
  - Micro-Labels: Monospace, Großbuchstaben, letterspaced (z. B. „SA 14 JUN", „NOCH OFFEN")
  - Body/Listen: klare Sans (z. B. *Inter* oder *Instrument Sans*)
- **Farben (Light):** Papier-Creme-Hintergrund `#F5F1E8`-Richtung, Tinte fast-schwarz warm, Akzent **Glut-Orange** (`#E4572E`-Richtung) für FAB/Badges/Progress, **Waldgrün/Moos** (`#3E5C41`-Richtung) für Erfolg/Sekundäres, Fluss-Blaugrau für Tertiäres
- **Farben (Dark):** Tiefes Nachtwald-Grün/Braun (`#171A14`-Richtung), gleiche Akzente leicht aufgehellt
- **Signature-Details (sparsam):** umrissene Serifen-Wörter als Kategorie-Marker/Wasserzeichen, Bottom Sheets statt neuer Seiten, große italic Serif-Begrüßung mit Nutzername
- Finale Hex-Werte + Type-Scale werden beim UI-Bau als CSS-Custom-Properties/Tailwind-Theme festgelegt

Qualitätsboden: responsive bis 320 px, sichtbarer Keyboard-Fokus, `prefers-reduced-motion` respektiert, Touch-Targets ≥ 44 px.

## 7. Architektur / Projektstruktur (Richtung)

```
src/
  lib/
    db/           # InstantDB-Client, Schema, Permissions
    data/         # Keyword-Mapping, Kategorien, Konstanten
    state/        # abgeleiteter Status, Svelte-Runes-Stores
  routes/
    +layout.svelte       # Auth-Gate, Theme
    +page.svelte         # Trip-Übersicht
    trip/[id]/+page.svelte  # Packliste
  lib/components/
    ItemRow.svelte, ItemList.svelte, CategoryView.svelte,
    ItemDetailSheet.svelte, CommentThread.svelte,
    TripCard.svelte, NewItemSheet.svelte, ThemeToggle.svelte …
  service-worker.ts
```

- Datenzugriff nur über eine dünne Repository-Schicht (`lib/db`), damit ein späterer Backend-Wechsel lokal bleibt
- Offline: InstantDB cached Queries in IndexedDB; Lesen offline, Schreiben queued

## 8. Nicht-Ziele (v1)

- Keine WhatsApp-Integration (technisch nicht sinnvoll möglich; Link in Gruppe teilen genügt)
- Keine Kosten-/Ausgabenverwaltung
- Kein Foto-Upload
- Keine Push-Benachrichtigungen (optional später, PWA-Push möglich)
- Keine Admin-Rollen über „Ersteller darf löschen" hinaus

## 9. Offene Risiken / Annahmen

- InstantDB bleibt kostenlos im benötigten Umfang (Datenvolumen < wenige MB/Jahr; Nutzer = ~5–8 Freunde) – Risiko minimal; Schema klein, Migration zu Self-Host/Alternative möglich
- Magic-Code-Login benötigt Versand-E-Mail bei InstantDB (Standard vorhanden, ggf. Absender konfigurieren)
