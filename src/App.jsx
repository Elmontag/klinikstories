import { useMemo, useState } from "react";

const initialInbox = [
  {
    id: "mail-1001",
    subject: "Danke an unser Team",
    receivedAt: "Heute, 08:42",
    status: "Neu",
    from: "pflege@beispiel.de",
    body:
      "Liebes Team, vielen Dank für euren Einsatz in dieser Woche. Die Rückmeldungen unserer Patientinnen und Patienten waren durchweg positiv. Wir möchten einige Zeilen als Klinikstory veröffentlichen.",
    attachments: ["danke-team.jpg", "schichtplan.png"]
  },
  {
    id: "mail-1002",
    subject: "Nachtschicht-Story",
    receivedAt: "Gestern, 19:05",
    status: "Geprüft",
    from: "leitung@beispiel.de",
    body:
      "Die Nachtschicht hat eine besondere Dynamik: Ruhe, Fokus und dennoch höchste Aufmerksamkeit. Diese Geschichte zeigt, wie wichtig unsere Kolleginnen und Kollegen im Hintergrund sind.",
    attachments: ["nacht.jpg"]
  },
  {
    id: "mail-1003",
    subject: "Spendenaktion im Klinikgarten",
    receivedAt: "Gestern, 14:22",
    status: "Veröffentlicht",
    from: "stiftung@beispiel.de",
    body:
      "Unsere Spendenaktion im Klinikgarten war ein voller Erfolg. Die Stimmung war freundlich, und viele Familien haben sich beteiligt. Wir möchten die Highlights als Thread veröffentlichen.",
    attachments: []
  }
];

const navItems = [
  { id: "dashboard", label: "Übersicht" },
  { id: "inbox", label: "Inbox" },
  { id: "publikation", label: "Publikation" },
  { id: "settings", label: "Einstellungen" }
];

const defaultImap = {
  server: "imap.klinik.de",
  port: "993",
  mailbox: "inbox@klinik.de",
  tls: true,
  username: "imap-reader"
};

const defaultBlueSky = {
  handle: "@klinikstories.bsky.social",
  appPassword: "••••••••",
  host: "https://bsky.social"
};

const MAX_POST = 300;

function buildThread(text) {
  const chunks = [];
  let remaining = text.trim();
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, MAX_POST));
    remaining = remaining.slice(MAX_POST).trim();
  }
  return chunks;
}

export default function App() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedMailId, setSelectedMailId] = useState(initialInbox[0].id);
  const [showPreview, setShowPreview] = useState(false);
  const [imapConfig, setImapConfig] = useState(defaultImap);
  const [blueSkyConfig, setBlueSkyConfig] = useState(defaultBlueSky);
  const [attachmentSelection, setAttachmentSelection] = useState({});
  const selectedMail = initialInbox.find((mail) => mail.id === selectedMailId);

  const threadParts = useMemo(() => buildThread(selectedMail.body), [selectedMail]);
  const selectedAttachments = attachmentSelection[selectedMailId] || {};

  const imapComplete = Object.values(imapConfig).every((value) => value);
  const blueSkyComplete = Object.values(blueSkyConfig).every((value) => value);
  const consistencyState = imapComplete && blueSkyComplete;

  const toggleAttachment = (file) => {
    setAttachmentSelection((prev) => ({
      ...prev,
      [selectedMailId]: {
        ...prev[selectedMailId],
        [file]: !prev[selectedMailId]?.[file]
      }
    }));
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">KS</div>
          <div>
            <p className="brand-title">Klinikstories</p>
            <p className="brand-subtitle">IMAP → BlueSky</p>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? "active" : ""}`}
              onClick={() => setActiveNav(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="meta-label">Aktiver Modus</p>
          <p className="meta-value">Admin</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>Klinikstories Dashboard</h1>
            <p>Steuere IMAP-Import, Vorschau und Publishing in einem Ablauf.</p>
          </div>
          <div className="status-pill">
            <span className={consistencyState ? "dot ok" : "dot warn"} />
            {consistencyState ? "Integrationen aktiv" : "Konfiguration prüfen"}
          </div>
        </header>

        <section className="grid">
          <article className="card wide">
            <div className="card-header">
              <div>
                <h2>Inbox-Übersicht</h2>
                <p>Wähle eine Mail und bereite sie für die Veröffentlichung vor.</p>
              </div>
              <button className="primary" type="button">
                IMAP-Sync starten
              </button>
            </div>
            <div className="inbox">
              <div className="inbox-list">
                {initialInbox.map((mail) => (
                  <button
                    key={mail.id}
                    className={`mail-item ${mail.id === selectedMailId ? "active" : ""}`}
                    onClick={() => setSelectedMailId(mail.id)}
                    type="button"
                  >
                    <div>
                      <h3>{mail.subject}</h3>
                      <p>{mail.receivedAt}</p>
                    </div>
                    <span className={`tag ${mail.status.toLowerCase()}`}>{mail.status}</span>
                  </button>
                ))}
              </div>
              <div className="inbox-detail">
                <div className="detail-header">
                  <div>
                    <h3>{selectedMail.subject}</h3>
                    <p>Postfach: {imapConfig.mailbox}</p>
                  </div>
                  <button className="secondary" type="button" onClick={() => setShowPreview(true)}>
                    Vorschau öffnen
                  </button>
                </div>
                <div className="detail-body">
                  <p className="detail-label">Inhalt (anonymisiert)</p>
                  <p className="detail-text">{selectedMail.body}</p>
                </div>
                <div className="attachments">
                  <p className="detail-label">Anhänge</p>
                  {selectedMail.attachments.length === 0 ? (
                    <p className="muted">Keine Anhänge verfügbar.</p>
                  ) : (
                    <div className="attachment-grid">
                      {selectedMail.attachments.map((file) => (
                        <label key={file} className="attachment">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedAttachments[file])}
                            onChange={() => toggleAttachment(file)}
                          />
                          <span>{file}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>

          <article className="card">
            <h2>Publikations-Check</h2>
            <p className="muted">Stellt sicher, dass IMAP, BlueSky und Dashboard konsistent sind.</p>
            <div className="checklist">
              <div className={imapComplete ? "check ok" : "check warn"}>
                <span className="check-title">IMAP-Konfiguration</span>
                <span>{imapComplete ? "Verbunden" : "Fehlende Angaben"}</span>
              </div>
              <div className={blueSkyComplete ? "check ok" : "check warn"}>
                <span className="check-title">BlueSky API</span>
                <span>{blueSkyComplete ? "Bereit" : "Zugang fehlt"}</span>
              </div>
              <div className="check ok">
                <span className="check-title">Dashboard-Status</span>
                <span>Responsive & aktuell</span>
              </div>
            </div>
            <div className="callout">
              <h3>Letzter erfolgreicher Sync</h3>
              <p>Heute, 08:45 • 3 neue Mails importiert</p>
            </div>
          </article>

          <article className="card">
            <h2>Thread-Vorschau</h2>
            <p className="muted">Max. {MAX_POST} Zeichen pro Post. Nummerierung wird ergänzt.</p>
            <div className="thread-preview">
              {threadParts.map((part, index) => (
                <div key={part} className="thread-part">
                  <div className="thread-meta">
                    Post {index + 1}/{threadParts.length}
                  </div>
                  <p>{part}</p>
                </div>
              ))}
            </div>
            <button className="primary" type="button">
              Publikation vorbereiten
            </button>
          </article>
        </section>

        <section className="grid">
          <article className="card">
            <h2>IMAP-Setup</h2>
            <div className="form">
              <label>
                Server
                <input
                  value={imapConfig.server}
                  onChange={(event) =>
                    setImapConfig((prev) => ({ ...prev, server: event.target.value }))
                  }
                />
              </label>
              <label>
                Port
                <input
                  value={imapConfig.port}
                  onChange={(event) =>
                    setImapConfig((prev) => ({ ...prev, port: event.target.value }))
                  }
                />
              </label>
              <label>
                Postfach
                <input
                  value={imapConfig.mailbox}
                  onChange={(event) =>
                    setImapConfig((prev) => ({ ...prev, mailbox: event.target.value }))
                  }
                />
              </label>
              <label>
                Benutzername
                <input
                  value={imapConfig.username}
                  onChange={(event) =>
                    setImapConfig((prev) => ({ ...prev, username: event.target.value }))
                  }
                />
              </label>
              <label className="toggle">
                TLS aktiv
                <input
                  type="checkbox"
                  checked={imapConfig.tls}
                  onChange={(event) =>
                    setImapConfig((prev) => ({ ...prev, tls: event.target.checked }))
                  }
                />
                <span className="switch" />
              </label>
            </div>
          </article>

          <article className="card">
            <h2>BlueSky-API</h2>
            <div className="form">
              <label>
                Handle
                <input
                  value={blueSkyConfig.handle}
                  onChange={(event) =>
                    setBlueSkyConfig((prev) => ({ ...prev, handle: event.target.value }))
                  }
                />
              </label>
              <label>
                App-Passwort
                <input
                  value={blueSkyConfig.appPassword}
                  onChange={(event) =>
                    setBlueSkyConfig((prev) => ({ ...prev, appPassword: event.target.value }))
                  }
                />
              </label>
              <label>
                API-Host
                <input
                  value={blueSkyConfig.host}
                  onChange={(event) =>
                    setBlueSkyConfig((prev) => ({ ...prev, host: event.target.value }))
                  }
                />
              </label>
            </div>
          </article>

          <article className="card">
            <h2>Team & Rollen</h2>
            <p className="muted">Nur Admins können User anlegen. Alle arbeiten im gleichen Board.</p>
            <div className="role-list">
              <div>
                <p className="role-title">Admin</p>
                <p className="muted">voller Zugriff auf IMAP, Publishing und Userverwaltung</p>
              </div>
              <div>
                <p className="role-title">Redaktion</p>
                <p className="muted">Inbox prüfen, Posts erstellen, Vorschau nutzen</p>
              </div>
              <div>
                <p className="role-title">Monitoring</p>
                <p className="muted">Status prüfen, aber keine Änderungen</p>
              </div>
            </div>
            <button className="secondary" type="button">
              Neuen User anlegen
            </button>
          </article>
        </section>
      </main>

      {showPreview ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Vorschau</h2>
                <p>Prüfe die Inhalte vor der Veröffentlichung.</p>
              </div>
              <button className="ghost" type="button" onClick={() => setShowPreview(false)}>
                Schließen
              </button>
            </div>
            <div className="modal-content">
              <h3>{selectedMail.subject}</h3>
              <p>{selectedMail.body}</p>
              <div className="modal-attachments">
                <p className="detail-label">Geplante Anhänge</p>
                {selectedMail.attachments.length === 0 ? (
                  <p className="muted">Keine Anhänge ausgewählt.</p>
                ) : (
                  <ul>
                    {selectedMail.attachments
                      .filter((file) => selectedAttachments[file])
                      .map((file) => (
                        <li key={file}>{file}</li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary" type="button" onClick={() => setShowPreview(false)}>
                Weiter bearbeiten
              </button>
              <button className="primary" type="button">
                Veröffentlichung starten
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
