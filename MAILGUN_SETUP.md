# Mailgun order confirmation setup

VoltEdge sends an order confirmation only after the live Supabase `create_order` call succeeds. A Mailgun failure does not undo the order or change the confirmation into an order failure.

## Environment variables

Configure these in the Vercel project. The API key is a server credential and must remain server-side.

| Name | Purpose |
| --- | --- |
| `MAILGUN_SEND_ENABLED` | Must be exactly `true` to allow the function to send. Leave unset/false until you explicitly authorize a sandbox send. |
| `MAILGUN_API_KEY` | Private Mailgun API key. Add it as a Vercel **Secret**. Never put its value in source code, browser JavaScript, `.env.example`, or a client-accessible file. |
| `MAILGUN_DOMAIN` | Mailgun sending domain, such as the sandbox domain shown in Mailgun. |
| `MAILGUN_FROM` | Sender address on that domain, for example `VoltEdge <postmaster@YOUR_SANDBOX_DOMAIN>`. |
| `MAILGUN_ALLOWED_RECIPIENTS` | Comma-separated, lowercase email addresses allowed to receive sandbox messages. Keep this limited to verified test inboxes. |

In Vercel, open the project’s **Settings → Environment Variables**. Set `MAILGUN_API_KEY` as a Secret for the intended environment. The domain, From address, and test-recipient allowlist are configuration values. Set them for Preview while testing; Production needs its own deliberate setup. Redeploy after changing environment variables.

The repository’s `.env.example` contains only empty variable-name placeholders. It does not contain any credentials. Do not copy a Mailgun key into a browser-facing variable or run a build step that serializes it into JavaScript.

## Mailgun region and sandbox

This endpoint uses the US API base URL `https://api.mailgun.net` and posts to `/v3/{domain}/messages`. The US region is fixed in the server function; no region selector is sent by the browser.

Mailgun sandbox domains can send only to authorized recipients. Add each test inbox in the Mailgun sandbox domain settings and complete the recipient’s verification. Add the same address to `MAILGUN_ALLOWED_RECIPIENTS` in Vercel. The endpoint rejects recipients outside that allowlist before contacting Mailgun.

## Safe testing

1. The function is disabled unless `MAILGUN_SEND_ENABLED` is exactly `true`. First check a Preview deployment with it unset; the endpoint should report that sending is disabled and checkout should still show the order as confirmed if order creation succeeded.
2. Configure only a sandbox domain and one verified test recipient in the allowlist. The plain static preview server does not run Vercel Functions; use a Vercel Preview deployment or `vercel dev` to exercise the endpoint.
3. Malformed requests and requests to a non-allowlisted recipient are rejected before contacting Mailgun.
4. An actual send requires enabling the flag, a successful live order, and an allowlisted inbox. Do not run that test until you explicitly want an email sent and have chosen a non-production Supabase project. It creates an order and sends a real sandbox email.

## Security limitation before production

The function accepts only an order number, recipient, customer name, and total, validates their format and size, checks the request origin, and restricts the recipient to the server-configured allowlist. It does not receive or return the Mailgun key, and its responses do not include provider response bodies or credentials.

The current browser-to-function request cannot prove that the supplied order number and total correspond to a genuine Supabase order. The order number format is predictable, and a caller can replay a valid-shaped request; the allowlist limits the recipient but does not prevent repeated messages to an approved test inbox. The origin check is a browser/CSRF safeguard, not proof of order authenticity. Therefore this implementation is for sandbox testing only and is **not production-secure for sending to arbitrary customer addresses**.

Before allowing customer addresses or using a verified production sending domain, add server-verifiable order proof and durable idempotency—for example, a signed order event or a server-side order lookup plus a unique send record. That will require a deliberate Supabase-side design and server-only credentials or webhook signing; it has not been added here.
