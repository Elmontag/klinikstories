import { useMemo, useState } from "react";
import { useEffect } from "react";

const demoInbox = [
  {
    id: "mail-1001",
    subject: "Danke an unser Team",
    receivedAt: "Heute, 08:42",
    status: "Neu",
    from: "pflege@beispiel.de",
    body:
      "Liebes Team, vielen Dank für euren Einsatz in dieser Woche. Die Rückmeldungen unserer Patientinnen und Patienten waren durchweg positiv. Wir möchten einige Zeilen als Klinikstory veröffentlichen.",
    attachments: ["danke-team.jpg", "schichtplan.png"]
  }
];

const navItems = [
  { id: "dashboard", label: "Übersicht" },
  { id: "workflow", label: "Inbox & Publikation" },
  { id: "settings", label: "Einstellungen" }
];

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

const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

export default function App() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedMailId, setSelectedMailId] = useState(demoInbox[0].id);
  const [showPreview, setShowPreview] = useState(false);
  const [attachmentSelection, setAttachmentSelection] = useState({});
  const [inbox, setInbox] = useState(demoInbox);
  const [mailboxName, setMailboxName] = useState("INBOX");
  const [lastSync, setLastSync] = useState("Noch kein Sync");
  const [syncError, setSyncError] = useState("");
  const [health, setHealth] = useState({
    imapConfigured: false,
    blueSkyConfigured: false,
    adminConfigured: false
  });
  const [blueSkyCheck, setBlueSkyCheck] = useState("Ungeprüft");
  const [publishStatus, setPublishStatus] = useState("");

  const selectedMail = inbox.find((mail) => mail.id === selectedMailId) ?? inbox[0];
  const threadParts = useMemo(
    () => (selectedMail ? buildThread(selectedMail.body) : []),
    [selectedMail]
  );
  const selectedAttachments = attachmentSelection[selectedMailId] || {};

  const toggleAttachment = (file) => {
    setAttachmentSelection((prev) => ({
      ...prev,
      [selectedMailId]: {
        ...prev[selectedMailId],
        [file]: !prev[selectedMailId]?.[file]
      }
    }));
  };

  const handleMailSelect = (mailId) => {
    setSelectedMailId(mailId);
  };

  const loadHealth = async () => {
    try {
      const response = await fetch(`${apiBase}/api/health`);
      if (!response.ok) {
        throw new Error("Health-Check fehlgeschlagen");
      }
      const data = await response.json();
      setHealth({
        imapConfigured: Boolean(data.imapConfigured),
        blueSkyConfigured: Boolean(data.blueSkyConfigured),
        adminConfigured: Boolean(data.adminConfigured)
      });
    } catch (error) {
      setHealth({
        imapConfigured: false,
        blueSkyConfigured: false,
        adminConfigured: false
      });
    }
  };

  const syncInbox = async () => {
    setSyncError("");
    try {
      const response = await fetch(`${apiBase}/api/imap/messages`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "IMAP-Sync fehlgeschlagen");
      }
      const data = await response.json();
      setInbox(data.messages.length > 0 ? data.messages : demoInbox);
      setMailboxName(data.mailbox ?? "INBOX");
      setLastSync(new Date().toLocaleString("de-DE"));
    } catch (error) {
      setSyncError(error.message);
      setInbox(demoInbox);
    }
  };

  const checkBlueSky = async () => {
    setBlueSkyCheck("Prüfe...");
    try {
      const response = await fetch(`${apiBase}/api/bluesky/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "BlueSky-Check fehlgeschlagen");
      }
      setBlueSkyCheck("Verbindung OK");
    } catch (error) {
      setBlueSkyCheck(`Fehler: ${error.message}`);
    }
  };

  const publishThread = async () => {
    if (!selectedMail) {
      return;
    }
    setPublishStatus("Publikation läuft...");
    try {
      const response = await fetch(`${apiBase}/api/bluesky/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread: threadParts
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Publikation fehlgeschlagen");
      }
      setPublishStatus("Veröffentlichung gestartet");
    } catch (error) {
      setPublishStatus(`Fehler: ${error.message}`);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const navDescription = {
    dashboard: "Status, Integrationen und Inbox-Überblick.",
    workflow: "Eingänge prüfen, Thread aufteilen und veröffentlichen.",
    settings: "IMAP, BlueSky und Rollen verwalten."
  };

  const consistencyState = health.imapConfigured && health.blueSkyConfigured;

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
            <p>{navDescription[activeNav]}</p>
          </div>
          <div className="status-pill">
            <span className={consistencyState ? "dot ok" : "dot warn"} />
            {consistencyState ? "Integrationen aktiv" : "Konfiguration prüfen"}
          </div>
        </header>

        {activeNav === "dashboard" ? (
          <section className="grid">
            <article className="card wide">
              <div className="card-header">
                <div>
                  <h2>Inbox-Übersicht</h2>
                  <p>Neue Mails im Blick, ohne Inhalt zu öffnen.</p>
                </div>
                <button className="primary" type="button" onClick={syncInbox}>
                  IMAP-Sync starten
                </button>
              </div>
              {syncError ? <p className="error">{syncError}</p> : null}
              <div className="inbox-list">
                {inbox.map((mail) => (
                  <button
                    key={mail.id}
                    className={`mail-item ${mail.id === selectedMailId ? "active" : ""}`}
                    onClick={() => handleMailSelect(mail.id)}
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
            </article>

            <article className="card">
              <h2>Publikations-Check</h2>
              <p className="muted">Konsistenz zwischen IMAP, BlueSky und Dashboard.</p>
              <div className="checklist">
                <div className={health.imapConfigured ? "check ok" : "check warn"}>
                  <span className="check-title">IMAP-Konfiguration</span>
                  <span>{health.imapConfigured ? "Verbunden" : "Fehlende Angaben"}</span>
                </div>
                <div className={health.blueSkyConfigured ? "check ok" : "check warn"}>
                  <span className="check-title">BlueSky API</span>
                  <span>{health.blueSkyConfigured ? "Bereit" : "Zugang fehlt"}</span>
                </div>
                <div className={health.adminConfigured ? "check ok" : "check warn"}>
                  <span className="check-title">Admin-Login</span>
                  <span>{health.adminConfigured ? "Hinterlegt" : "Fehlt"}</span>
                </div>
              </div>
              <div className="callout">
                <h3>Letzter erfolgreicher Sync</h3>
                <p>{lastSync} • Postfach: {mailboxName}</p>
              </div>
            </article>

            <article className="card">
              <h2>Nächste Schritte</h2>
              <p className="muted">Wechsle in den Workflow, um Inhalte zu prüfen und zu publizieren.</p>
              <div className="role-list">
                <div>
                  <p className="role-title">Inbox prüfen</p>
                  <p className="muted">Mails öffnen, Anhänge markieren, Story vorbereiten.</p>
                </div>
                <div>
                  <p className="role-title">Publikation auslösen</p>
                  <p className="muted">Thread-Länge prüfen und Veröffentlichung starten.</p>
                </div>
              </div>
              <button className="secondary" type="button" onClick={() => setActiveNav("workflow")}>
                Zum Workflow
              </button>
            </article>
          </section>
        ) : null}

        {activeNav === "workflow" ? (
          <section className="grid">
            <article className="card wide">
              <div className="card-header">
                <div>
                  <h2>Inbox & Publikation</h2>
                  <p>Inhalte prüfen, Anhänge auswählen und Thread vorbereiten.</p>
                </div>
                <div className="button-row">
                  <button className="secondary" type="button" onClick={syncInbox}>
                    IMAP-Sync
                  </button>
                  <button
                    className="primary"
                    type="button"
                    disabled={!selectedMail}
                    onClick={() => setShowPreview(true)}
                  >
                    Publizieren
                  </button>
                </div>
              </div>
              {syncError ? <p className="error">{syncError}</p> : null}
              <div className="inbox">
                <div className="inbox-list">
                  {inbox.map((mail) => (
                    <button
                      key={mail.id}
                      className={`mail-item ${mail.id === selectedMailId ? "active" : ""}`}
                      onClick={() => handleMailSelect(mail.id)}
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
                      <h3>{selectedMail?.subject ?? "Keine Mail ausgewählt"}</h3>
                      <p>Postfach: {mailboxName}</p>
                    </div>
                    <p className="muted">Absender wird nicht veröffentlicht</p>
                  </div>
                  <div className="detail-body">
                    <p className="detail-label">Inhalt (anonymisiert)</p>
                    <p className="detail-text">{selectedMail?.body ?? ""}</p>
                  </div>
                  <div className="attachments">
                    <p className="detail-label">Geplante Anhänge</p>
                    {selectedMail?.attachments?.length ? (
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
                    ) : (
                      <p className="muted">Keine Anhänge verfügbar.</p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </section>
        ) : null}

        {activeNav === "settings" ? (
          <section className="grid">
            <article className="card">
              <h2>IMAP-Setup</h2>
              <p className="muted">Zugangsdaten werden serverseitig verwaltet.</p>
              <div className="info-list">
                <div>
                  <p className="role-title">Status</p>
                  <p className="muted">
                    {health.imapConfigured ? "Konfiguriert" : "Fehlende Angaben"}
                  </p>
                </div>
                <div>
                  <p className="role-title">Postfach</p>
                  <p className="muted">{mailboxName}</p>
                </div>
              </div>
              <button className="secondary" type="button" onClick={syncInbox}>
                IMAP-Verbindung prüfen
              </button>
            </article>

            <article className="card">
              <h2>BlueSky-API</h2>
              <p className="muted">Zugangsdaten werden serverseitig verwaltet.</p>
              <div className="info-list">
                <div>
                  <p className="role-title">Status</p>
                  <p className="muted">
                    {health.blueSkyConfigured ? "Konfiguriert" : "Fehlende Angaben"}
                  </p>
                </div>
                <div>
                  <p className="role-title">Verbindungstest</p>
                  <p className="muted">{blueSkyCheck}</p>
                </div>
              </div>
              <button className="secondary" type="button" onClick={checkBlueSky}>
                BlueSky-Verbindung prüfen
              </button>
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
            </article>

            <article className="card">
              <h2>Admin-Login</h2>
              <p className="muted">Admin-Login wird serverseitig gesetzt.</p>
              <div className="info-list">
                <div>
                  <p className="role-title">Status</p>
                  <p className="muted">
                    {health.adminConfigured ? "Hinterlegt" : "Fehlt"}
                  </p>
                </div>
                <div>
                  <p className="role-title">Hinweis</p>
                  <p className="muted">ADMIN_EMAIL und ADMIN_PASSWORD in der .env setzen.</p>
                </div>
              </div>
            </article>
          </section>
        ) : null}
      </main>

      {showPreview ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Publikations-Vorschau</h2>
                <p>Prüfe den Thread, bevor du veröffentlichst.</p>
              </div>
              <button className="ghost" type="button" onClick={() => setShowPreview(false)}>
                Schließen
              </button>
            </div>
            <div className="modal-content">
              <h3>{selectedMail?.subject}</h3>
              <div className="thread-preview">
                {threadParts.map((part, index) => (
                  <div key={`${part}-${index}`} className="thread-part">
                    <div className="thread-meta">
                      Post {index + 1}/{threadParts.length}
                    </div>
                    <p>{part}</p>
                  </div>
                ))}
              </div>
              <div className="modal-attachments">
                <p className="detail-label">Geplante Anhänge</p>
                {selectedMail?.attachments?.length ? (
                  <ul>
                    {selectedMail.attachments
                      .filter((file) => selectedAttachments[file])
                      .map((file) => (
                        <li key={file}>{file}</li>
                      ))}
                  </ul>
                ) : (
                  <p className="muted">Keine Anhänge ausgewählt.</p>
                )}
              </div>
              {publishStatus ? <p className="status-text">{publishStatus}</p> : null}
            </div>
            <div className="modal-footer">
              <button className="secondary" type="button" onClick={() => setShowPreview(false)}>
                Weiter bearbeiten
              </button>
              <button className="primary" type="button" onClick={publishThread}>
                Veröffentlichung starten
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
