---
task: Collect Metrics
responsavel: '@performance-analyst'
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - platform_list: Platforms to collect from
  - date_range: Date range (e.g., "last 7 days", "2026-03-18 to 2026-03-24")
  - account_ids: Account identifiers per platform
  - metrics_list: Metrics to collect (reach, impressions, likes, comments, saves, shares, follower_growth)
Saida: |
  - metrics_dataset: Structured metrics per post per platform
  - data_quality_score: Completeness of data (%)
---

# collect-metrics

Collect raw engagement metrics from all active platforms for analysis.

## Core Metrics by Platform

| Metric | Instagram | TikTok | YouTube | LinkedIn |
|--------|-----------|--------|---------|----------|
| Reach | ✅ | ✅ | Impressions | ✅ |
| Impressions | ✅ | ✅ | ✅ | ✅ |
| Likes | ✅ | ✅ | ✅ | ✅ |
| Comments | ✅ | ✅ | ✅ | ✅ |
| Shares | ✅ | ✅ | ✅ | ✅ |
| Saves | ✅ | ❌ | ❌ | ❌ |
| Profile visits | ✅ | ✅ | ❌ | ✅ |
| Follower growth | ✅ | ✅ | Subscribers | ✅ |
| Video views | Reels only | ✅ | ✅ | ❌ |
| Watch time | Reels | ✅ | ✅ | ❌ |

## Output Format

```markdown
## Metrics Dataset — [period] — [brand]

### Instagram
| Post | Date | Reach | Impressions | Likes | Comments | Saves | Shares | Eng Rate |
|------|------|-------|-------------|-------|----------|-------|--------|---------|
| [title] | [date] | [X] | [X] | [X] | [X] | [X] | [X] | [X]% |

### TikTok
[Same structure]

**Data Quality Score:** [X]% ([X]/[Y] metrics collected)
**Missing data:** [list any gaps]
```
