// Server-side only: Vercel serves this as POST /api/send-order-confirmation.
// The browser never receives Mailgun credentials.
const MAILGUN_API_BASE = "https://api.mailgun.net";
const MAX_BODY_BYTES = 4096;
const MAX_ORDER_TOTAL = 9999999999.99;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function respond(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(body);
}

function validEmail(value) {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      parsed.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

module.exports = async function sendOrderConfirmation(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return respond(res, 405, { ok: false, error: "POST required." });
  }

  if (!sameOrigin(req) || (req.headers["sec-fetch-site"] && req.headers["sec-fetch-site"] !== "same-origin")) {
    return respond(res, 403, { ok: false, error: "Request origin rejected." });
  }

  const contentType = String(req.headers["content-type"] || "").split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return respond(res, 415, { ok: false, error: "JSON request required." });
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  const body = req.body;
  if (contentLength > MAX_BODY_BYTES || !body || typeof body !== "object" || Array.isArray(body) ||
      Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY_BYTES) {
    return respond(res, 400, { ok: false, error: "Malformed request." });
  }

  const allowedFields = new Set(["orderId", "recipient", "name", "total"]);
  if (Object.keys(body).some((key) => !allowedFields.has(key))) {
    return respond(res, 400, { ok: false, error: "Malformed request." });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const recipient = typeof body.recipient === "string" ? body.recipient.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.replace(/\s+/g, " ").trim() : "";
  const total = body.total;
  if (!/^VE-\d{6}$/.test(orderId) || !validEmail(recipient) || !name || name.length > 120 ||
      typeof total !== "number" || !Number.isFinite(total) || total < 0 || total > MAX_ORDER_TOTAL) {
    return respond(res, 400, { ok: false, error: "Order confirmation data is invalid." });
  }

  if (process.env.MAILGUN_SEND_ENABLED !== "true") {
    return respond(res, 503, { ok: false, error: "Email sending is disabled." });
  }

  const apiKey = String(process.env.MAILGUN_API_KEY || "").trim();
  const domain = String(process.env.MAILGUN_DOMAIN || "").trim().toLowerCase();
  const from = String(process.env.MAILGUN_FROM || "").trim();
  const allowedRecipients = String(process.env.MAILGUN_ALLOWED_RECIPIENTS || "")
    .split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  const fromAddress = from.match(/<([^<>]+)>/)?.[1] || from;
  const fromDomain = fromAddress.includes("@") ? fromAddress.split("@").pop().toLowerCase() : "";

  const validDomain = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))+$/.test(domain);
  if (!apiKey || !validDomain || /[\r\n]/.test(from) || !validEmail(fromAddress) || fromDomain !== domain || !allowedRecipients.length || !allowedRecipients.every(validEmail)) {
    return respond(res, 503, { ok: false, error: "Email service is not configured." });
  }
  if (!allowedRecipients.includes(recipient)) {
    return respond(res, 403, { ok: false, error: "Recipient is not approved for sandbox sending." });
  }

  const safeName = escapeHtml(name);
  const safeOrderId = escapeHtml(orderId);
  const formattedTotal = total.toLocaleString("en-NG", { style: "currency", currency: "NGN" });
  const subject = `VoltEdge order ${orderId} confirmed`;
  const text = `Hello ${name},\n\nYour VoltEdge order ${orderId} is confirmed.\nOrder total: ${formattedTotal}\n\nThank you for shopping with VoltEdge.`;
  const html = `<p>Hello ${safeName},</p><p>Your VoltEdge order <strong>${safeOrderId}</strong> is confirmed.</p><p>Order total: <strong>${escapeHtml(formattedTotal)}</strong></p><p>Thank you for shopping with VoltEdge.</p>`;
  const form = new FormData();
  form.set("from", from);
  form.set("to", recipient);
  form.set("subject", subject);
  form.set("text", text);
  form.set("html", html);

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 10000);
  try {
    const response = await fetch(`${MAILGUN_API_BASE}/v3/${encodeURIComponent(domain)}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}` },
      body: form,
      signal: abortController.signal
    });
    if (!response.ok) return respond(res, 502, { ok: false, error: "Mailgun could not accept the confirmation email." });
    return respond(res, 200, { ok: true, message: "Confirmation email sent." });
  } catch {
    return respond(res, 502, { ok: false, error: "Confirmation email could not be sent." });
  } finally {
    clearTimeout(timeout);
  }
};
