---
task: Detect Anomaly
responsavel: '@performance-analyst'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - metrics_dataset: Current metrics data
  - baselines: 30-day rolling averages per metric
  - alert_thresholds: Configured alert thresholds (default: ±30% from baseline)
Saida: |
  - anomaly_report: List of detected anomalies
  - severity: HIGH / MEDIUM / LOW per anomaly
  - affected_posts: Posts triggering the anomaly
---

# detect-anomaly

Detect significant positive or negative deviations from baseline performance.

## Anomaly Thresholds (Default)

| Severity | Threshold | Action |
|----------|-----------|--------|
| HIGH | >50% drop or >200% spike | Alert immediately |
| MEDIUM | 30-50% drop or 100-200% spike | Alert within 2h |
| LOW | 15-30% deviation | Log in weekly report |

## Output Format

```markdown
## Anomaly Report — [date HH:MM]

### HIGH Severity
- **[Metric]** dropped [X]% below baseline on [post/platform]
  Baseline: [X] | Current: [Y] | Detected at: [HH:MM]
  Recommended action: [action]

### MEDIUM Severity
- **[Metric]** is [X]% above baseline (positive spike)
  [Post] is trending — recommend boosting or creating follow-up

### LOW Severity (logged only)
- [List minor deviations]

### No anomalies detected: [confirm if clean]
```
