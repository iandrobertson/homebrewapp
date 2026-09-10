# Personal data breach runbook (Art. 33 / 34)

1. Contain: rotate `BETTER_AUTH_SECRET`, database passwords, and `AUDIT_IP_SALT`.
   Revoke sessions (`delete from sessions`).
2. Assess: what categories of data, how many members, whether a chapter boundary
   failed (check `audit_log` and application JSON logs).
3. Notify the supervisory authority within 72 hours if there is a risk to rights
   and freedoms. Use the ROPA in `docs/gdpr/ropa.md` as the inventory.
4. Notify affected members without undue delay if the risk is high.
5. Record the incident: time detected, systems, data categories, decisions, and
   remediation. Keep that record for accountability even if notification is not
   required.
6. Fix the root cause and re-run `npm run test:integration` before returning to
   service.
