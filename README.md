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

## Sicherheit & Datenschutz
- Credentials werden verschlüsselt gespeichert.
- Config außerhalb des Webroots (z. B. `/var/klinikstories/config`).
- Anonymisierung: Absendernamen/Emails werden nicht in Posts übernommen.
- Least-Privilege: Minimale Rechte für Service-Accounts.

## Deployment
Deployment über Docker Compose.

- Webroot enthält keine Secrets/Config.

## Konfigurations-Templates & Einrichtung
Die Templates liegen im Repo unter `config-templates/`. Sie dienen als Vorlage und enthalten keine Secrets.

1. Kopiere die Templates außerhalb des Webroots (z. B. `/var/klinikstories/config`).
2. Ergänze echte Zugangsdaten und Secrets.

## Nicht-Ziele (Explizit)
- Keine Speicherung persönlicher Absenderdaten in Posts.
- Keine eigenständige Benutzer-Self-Registration.
