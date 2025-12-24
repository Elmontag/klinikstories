# Klinikstories Dashboard

Ein modernes, schlankes und responsives Dashboard in React/Vite zur Steuerung der Publikation von IMAP-Mails als BlueSky-Posts via API. Das Deployment erfolgt automatisiert über Docker. Alle User arbeiten in einem gemeinsamen Dashboard. Admin-Login wird per Environment-Variablen festgelegt. User-Management ist nur für den Admin möglich.

## Ziele & Scope
- Zentrales Dashboard für das gemeinsame Team.
- Veröffentlichung von Mail-Inhalten als BlueSky-Post oder Thread.
- Anonyme Publikation (keine Absenderdaten im Post).
- Fokus auf Sicherheit und klare Rollen (Admin-only User-Management).

## Userflow (Soll-Zustand)
1. **Login:** User authentifiziert sich sicher.
2. **Inbox-Übersicht:** Eingegangene Mails eines hinterlegten Postfachs werden angezeigt.
3. **Auswahl:** User wählt eine Mail aus.
4. **Publikation / Rückzug:**
   - Mit Klick wird die Mail als Post oder Thread publiziert.
   - Publikationsstatus ist sichtbar.
   - Der Status wird als Tag/Label in der Mail gespeichert.
   - Zeichenlimit: 300 Zeichen pro Post. Bei Threads die Postnummer (X/Y) angeben.
5. **Anonymität:** Absenderdaten werden nicht übernommen.
6. **Vorschau:** Inhalte werden vor der Publikation in einer Lightbox geprüft.
7. **Anhänge:** Bild-Anhänge können optional per Checkbox dem Post/Thread hinzugefügt werden.
8. **Sicherheit:** Schutz von Login- und API-Daten.
9. **Rollen:** Nur Admins dürfen neue User anlegen.

## Funktionsumfang (geplant)
- IMAP-Integration: Abruf von Mails aus einem konfigurierten Postfach.
- BlueSky-Integration: Post/Thread-Publishing inkl. optionaler Bildanhänge.
- Status-Tracking: Speicherung des Publikationsstatus als Mail-Tag/Label.
- Preview-Workflow: Lightbox-Preview vor Veröffentlichung.
- Rollen & Rechte: Admin-only User-Erstellung.
- Responsive UI: Modernes, schlankes Dashboard für Desktop & Mobile.

## Konfiguration
Die UI liest Konfigurationswerte aus Environment-Variablen (Vite-Präfix `VITE_`). Lege dazu eine `.env` auf Basis von `.env.example` an. Keine Secrets im Repository ablegen.

Benötigte Variablen:
- `VITE_IMAP_SERVER`
- `VITE_IMAP_PORT`
- `VITE_IMAP_MAILBOX`
- `VITE_IMAP_TLS`
- `VITE_IMAP_USERNAME`
- `VITE_BLUESKY_HANDLE`
- `VITE_BLUESKY_APP_PASSWORD`
- `VITE_BLUESKY_HOST`

## Deployment (Docker Compose)
Das Dashboard wird als statische Vite-App gebaut und über `vite preview` bereitgestellt.

```bash
cp .env.example .env

docker compose up --build
```

Die Compose-Definition nutzt ein Volume für persistente Daten (`dashboard-data`). Dieses Volume ist vorgesehen, um zukünftige Status- oder Sync-Daten dauerhaft zu speichern.

## Sicherheit & Datenschutz
- Credentials werden verschlüsselt gespeichert.
- Anonymisierung: Absendernamen/Emails werden nicht in Posts übernommen.
- Least-Privilege: Minimale Rechte für Service-Accounts.

## Deployment
Deployment über Docker Compose.
- Webroot enthält keine Secrets/Config.

## Nicht-Ziele (Explizit)
- Keine Speicherung persönlicher Absenderdaten in Posts.
- Keine eigenständige Benutzer-Self-Registration.
