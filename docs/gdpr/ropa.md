# Record of Processing Activities (GDPR Art. 30)

**Controller:** the homebrew chapter operating this Homebrew instance.
**Last reviewed:** 2026-09-10

Homebrew is self-hosted. Application data stays on the operator's infrastructure.
In-cluster observability (OpenTelemetry, Prometheus, Loki, Tempo, Grafana) and
CloudNativePG run in the same cluster. A public-cloud Kubernetes control plane,
if used, is a processor and needs a DPA.

## Processing activities

| # | Purpose | Data subjects | Categories of data | Lawful basis | Retention |
|---|---------|---------------|--------------------|--------------|-----------|
| 1 | Operate user accounts | Chapter members | Name, email, password hash, chapter, email-verified flag | Art. 6(1)(b) contract; consent recorded at signup per Art. 7 | Until the member deletes their account |
| 2 | Store and organise recipes | Chapter members | Recipe name, style, batch size, gravities, ABV, IBU, colour, notes | Art. 6(1)(b) contract | Until deleted by the member, or with the account |
| 3 | Share recipes within a chapter | Chapter members | Recipe id, sharer id, recipient id, timestamp | Art. 6(1)(b) contract | Until revoked, or the recipe/account is deleted |
| 4 | Security and accountability | Chapter members | Action type, timestamp, salted SHA-256 of IP address | Art. 6(1)(f) legitimate interest; Art. 5(2) accountability | 12 months, then automatically deleted |
| 5 | Account verification and password reset | Chapter members | Email address, single-use token, expiry | Art. 6(1)(b) contract | Token expires in 1 hour; unverified signups purged after 7 days |

## Categories of recipient

None outside the instance. A recipe is visible only to its owner and to specific
members that owner has shared it with — always inside a single chapter.

`chapter.region` is organisational (who you can share with). It is not geographic
data residency. Place the cluster in the EU if members are in the EU.

## International transfers

None unless the operator hosts the cluster outside the members' region. Document
that choice and the transfer tool if it happens.

## Technical and organisational measures (Art. 32)

- Passwords hashed with scrypt (Better Auth default)
- Tenant isolation enforced by PostgreSQL row-level security
- Credential tables unreachable from the application runtime role
- IP addresses stored only as salted digests
- Session cookies HttpOnly, Secure in production, SameSite=Lax
- Strict Content-Security-Policy with per-request nonces
- Rate limiting on sign-in, sign-up and password reset
- Dependency and container vulnerability scanning in CI
- Structured logs with emails, passwords and tokens redacted
