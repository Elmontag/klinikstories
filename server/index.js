import "dotenv/config";
import express from "express";
import cors from "cors";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { BskyAgent } from "@atproto/api";
import tls from "tls";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const config = {
  imap: {
    host: process.env.IMAP_HOST,
    port: Number(process.env.IMAP_PORT ?? 993),
    secure: process.env.IMAP_TLS ? process.env.IMAP_TLS === "true" : true,
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASS
    },
    mailbox: process.env.IMAP_MAILBOX ?? "INBOX"
  },
  bluesky: {
    service: process.env.BLUESKY_HOST ?? "https://bsky.social",
    handle: process.env.BLUESKY_HANDLE,
    appPassword: process.env.BLUESKY_APP_PASSWORD
  },
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
  }
};

const isImapConfigured = () =>
  Boolean(config.imap.host && config.imap.auth.user && config.imap.auth.pass);

const isBlueSkyConfigured = () =>
  Boolean(config.bluesky.handle && config.bluesky.appPassword);

const isAdminConfigured = () =>
  Boolean(config.admin.email && config.admin.password);

const pingImap = () =>
  new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: config.imap.host,
        port: config.imap.port,
        servername: config.imap.host,
        timeout: 5000
      },
      () => {
        socket.end();
        resolve({ ok: true });
      }
    );

    socket.on("error", (error) => {
      resolve({ ok: false, error: error.message });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ ok: false, error: "Timeout" });
    });
  });

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    imapConfigured: isImapConfigured(),
    blueSkyConfigured: isBlueSkyConfigured(),
    adminConfigured: isAdminConfigured(),
    imap: {
      host: config.imap.host ?? "",
      port: config.imap.port ?? 0,
      mailbox: config.imap.mailbox ?? "",
      tls: config.imap.secure ?? true,
      userConfigured: Boolean(config.imap.auth.user)
    },
    bluesky: {
      host: config.bluesky.service,
      handleConfigured: Boolean(config.bluesky.handle)
    }
  });
});

app.get("/api/imap/ping", async (_req, res) => {
  if (!config.imap.host) {
    res.status(400).json({ ok: false, error: "IMAP_HOST fehlt." });
    return;
  }
  const result = await pingImap();
  res.json(result);
});

app.get("/api/imap/messages", async (req, res) => {
  if (!isImapConfigured()) {
    res.status(400).json({
      error: "IMAP-Konfiguration unvollständig."
    });
    return;
  }

  const mailbox =
    typeof req.query.mailbox === "string" && req.query.mailbox.trim().length > 0
      ? req.query.mailbox.trim()
      : config.imap.mailbox;

  const client = new ImapFlow(config.imap);
  try {
    await client.connect();
    await client.mailboxOpen(mailbox);

    const messageUids = await client.search({ all: true });
    const latestUids = messageUids.slice(-20).reverse();
    const messages = [];

    for await (const message of client.fetch(latestUids, {
      envelope: true,
      source: true,
      flags: true,
      internalDate: true,
      uid: true
    })) {
      const parsed = await simpleParser(message.source);
      const from = parsed.from?.text ?? "Unbekannt";
      const attachments = parsed.attachments?.map((file) => file.filename).filter(Boolean) ?? [];

      messages.push({
        id: `uid-${message.uid}`,
        subject: parsed.subject ?? message.envelope?.subject ?? "(Ohne Betreff)",
        receivedAt: message.internalDate?.toLocaleString("de-DE") ?? "Unbekannt",
        status: message.flags?.includes("\\Seen") ? "Gelesen" : "Neu",
        from,
        body: parsed.text?.trim() ?? "",
        attachments
      });
    }

    res.json({ mailbox, messages });
  } catch (error) {
    res.status(500).json({
      error: "IMAP-Abruf fehlgeschlagen.",
      details: error.message
    });
  } finally {
    try {
      await client.logout();
    } catch (logoutError) {
      console.error("IMAP logout failed", logoutError);
    }
  }
});

app.post("/api/bluesky/check", async (_req, res) => {
  if (!isBlueSkyConfigured()) {
    res.status(400).json({ error: "BlueSky-Konfiguration unvollständig." });
    return;
  }

  const agent = new BskyAgent({ service: config.bluesky.service });
  try {
    await agent.login({
      identifier: config.bluesky.handle,
      password: config.bluesky.appPassword
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({
      error: "BlueSky-Login fehlgeschlagen.",
      details: error.message
    });
  }
});

app.post("/api/bluesky/publish", async (req, res) => {
  if (!isBlueSkyConfigured()) {
    res.status(400).json({ error: "BlueSky-Konfiguration unvollständig." });
    return;
  }

  const { thread } = req.body;
  if (!Array.isArray(thread) || thread.length === 0) {
    res.status(400).json({ error: "Keine Thread-Inhalte übergeben." });
    return;
  }

  const agent = new BskyAgent({ service: config.bluesky.service });
  try {
    await agent.login({
      identifier: config.bluesky.handle,
      password: config.bluesky.appPassword
    });

    const first = await agent.post({ text: thread[0] });
    let previous = first;

    for (const entry of thread.slice(1)) {
      previous = await agent.post({
        text: entry,
        reply: {
          root: first,
          parent: previous
        }
      });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({
      error: "BlueSky-Publikation fehlgeschlagen.",
      details: error.message
    });
  }
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => {
  console.log(`API läuft auf Port ${port}`);
});
