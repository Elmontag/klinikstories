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

## Konfiguration
Die UI liest den API-Endpunkt aus `VITE_API_BASE`. Backend-Zugänge werden ausschließlich serverseitig über Environment-Variablen gesetzt. Lege dazu eine `.env` auf Basis von `.env.example` an. Keine Secrets im Repository ablegen.

Benötigte Variablen:
- Frontend: `VITE_API_BASE`
- IMAP: `IMAP_HOST`, `IMAP_PORT`, `IMAP_MAILBOX`, `IMAP_TLS`, `IMAP_USER`, `IMAP_PASS`
- BlueSky: `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD`, `BLUESKY_HOST`
- Admin: `ADMIN_EMAIL`, `ADMIN_PASSWORD`

Hinweis: Für den Ordnernamen verwende in der Regel `INBOX` (Großbuchstaben).

## Deployment (Docker Compose)
Das Dashboard wird als statische Vite-App gebaut und über `vite preview` bereitgestellt. Die API läuft als eigener Service.

```bash
cp .env.example .env

docker compose up --build
```

Die Compose-Definition nutzt ein Volume für persistente Daten (`dashboard-data`). Dieses Volume ist für zukünftige Status- oder Sync-Daten vorgesehen.

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
