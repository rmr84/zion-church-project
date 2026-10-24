import fs from "node:fs";
import { defaultLogPath } from "@/lib/notify";

export const metadata = { title: "Notification log" };

function readEntries() {
  try {
    return fs
      .readFileSync(defaultLogPath(), "utf8")
      .split("\n---\n")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .reverse();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export default function NotificationsPage() {
  const entries = readEntries();

  return (
    <section className="wrap wide">
      <h1>Notification log</h1>
      <p className="lede">
        When a request is received, or its status changes, the email we would send is written
        here and printed in the server console. No email service is connected. Care team notes
        are left out.
      </p>
      {entries.length === 0 ? (
        <p className="empty">Nothing has been logged yet. Save a status change to write the first one.</p>
      ) : (
        entries.map((entry, index) => (
          <pre key={`${index}-${entry.slice(0, 40)}`} className="log">{entry}</pre>
        ))
      )}
    </section>
  );
}
