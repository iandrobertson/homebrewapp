# Observability

Self-hosted, same cluster, so member data does not leave the controller's
infrastructure. Install the upstream Helm charts, then this collector:

```bash
# kube-prometheus-stack (Prometheus + Grafana + Alertmanager)
# grafana/loki, grafana/tempo
kubectl apply -k deploy/observability
```

Recommended chart values:

- Loki and Tempo retention: 14 days (see `docs/gdpr/retention.md`)
- Grafana datasources: Prometheus, Loki, Tempo
- Dashboards: request rate / errors / duration, HPA replica count, Postgres
  connections (CNPG PodMonitor), auth/RLS failures from app JSON logs

Alerts to wire in Prometheus:

- `HomebrewHigh5xx` — 5xx ratio above 2% for 10 minutes
- `HomebrewProbeFailing` — readiness/liveness failing
- `HomebrewPruneFailed` — CronJob `db:prune` not succeeding daily
- `HomebrewImageScanFailed` — CI Trivy / npm audit job red

The app emits traces and metrics only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set.
Local Docker Compose leaves it unset.

Node autoscaling (Cluster Autoscaler or Karpenter) is a cluster-operator concern.
This repo ships the application HPA in the prod overlay.
