# Sub-processors

Homebrew does not send member data to analytics, APM vendors, or email marketing
tools. Observability is self-hosted in the same cluster.

| Processor | Role | Notes |
|-----------|------|-------|
| Cluster operator / public cloud (if used) | Hosts Kubernetes, disks, and backups | Requires a DPA and a documented region |
| Outbound SMTP (production only, when configured) | Transactional verification and password-reset mail | Choose a processor with a DPA; do not use a marketing ESP |

No cookies other than the strictly necessary session cookie.
