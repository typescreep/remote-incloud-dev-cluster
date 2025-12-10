# Developing promql graphs

## Installation

```bash
helm upgrade --install prometheus oci://ghcr.io/prometheus-community/charts/prometheus \
 -n monitoring \
 --create-namespace \
 --set server.service.type=ClusterIP
```

## Running

```bash
kubectl port-forward -n monitoring svc/prometheus-server 9090:80
kubectl port-forward -n monitoring svc/prometheus-prometheus-pushgateway 9091:9091
```

## Some queries

```bash
curl "http://localhost:9090/api/v1/query_range?query=container_memory_usage_bytes&start=2025-01-01T00:00:00Z&end=2025-12-31T23:59:59Z&step=1h"
```
