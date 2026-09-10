import "server-only";

type LogFields = Record<string, unknown>;

const REDACT = new Set(["email", "password", "token", "authorization", "cookie"]);

function sanitize(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = REDACT.has(key.toLowerCase()) ? "[redacted]" : value;
  }
  return out;
}

function write(level: string, event: string, fields: LogFields = {}) {
  const line = JSON.stringify({
    level,
    event,
    ts: new Date().toISOString(),
    service: process.env.OTEL_SERVICE_NAME ?? "homebrewapp",
    ...sanitize(fields),
  });
  if (level === "error") console.error(line);
  else console.info(line);
}

export const logger = {
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};
