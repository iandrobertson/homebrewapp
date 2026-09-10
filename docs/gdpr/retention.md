# Retention schedule

Enforced by `npm run db:prune` (schedule daily in production).

| Record | Retention | Action |
|--------|-----------|--------|
| User account and recipes | Until the member deletes the account, or deletes the recipe | Immediate hard delete |
| Unverified signups | 7 days | Deleted by prune |
| Sessions | Until expiry (7 days, sliding) | Deleted at expiry; prune removes leftovers |
| Verification / reset tokens | 1 hour | Deleted at expiry; prune removes leftovers |
| Audit log | 12 months | Deleted by prune |
| Application logs / traces | 14 days (cluster default in observability manifests) | Loki / Tempo retention |
| Database backups | Operator-defined; recommended 30 days | CloudNativePG scheduled backups |

Erasure (Art. 17) is immediate. One pseudonymous audit row (`erasure_requested`)
survives without email or raw IP so the controller can show the erasure happened.
