---
task: Send Alert
responsavel: '@performance-analyst'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - anomaly_report: Output from detect-anomaly
  - channels: Where to send alert (console/file/webhook)
  - priority: Alert priority (HIGH/MEDIUM/LOW)
Saida: |
  - notification_log: Record of alert sent
  - delivery_status: Confirmed delivery
---

# send-alert

Send performance alerts to the appropriate channels based on anomaly severity.

## Alert Templates

### HIGH Priority Alert
```
🚨 PERFORMANCE ALERT — [platform] — [HH:MM]

Metric: [metric name]
Current: [value] ([-X]% below baseline)
Expected: [baseline value]
Post: [post title if applicable]

Recommended immediate action:
→ [action]

— Echo, Performance Analyst
```

### MEDIUM Priority Alert
```
⚠️ Performance Notice — [platform]

[Metric] is [X]% below normal for [post/date].
No immediate action required but monitor closely.

— Echo, Performance Analyst
```

### Positive Spike Alert
```
📈 Trending Post Detected — [platform]

[Post] is performing [X]% above baseline.
Reach: [X] | Eng Rate: [X]%

Recommended: Consider boosting or creating follow-up content.

— Echo, Performance Analyst
```

## Output Format

```markdown
## Alert Log — [date HH:MM]

Alert sent:
- Type: [HIGH/MEDIUM/LOW/POSITIVE]
- Platform: [platform]
- Message: [alert text]
- Channel: [console/file/webhook]
- Status: ✅ Delivered
```
