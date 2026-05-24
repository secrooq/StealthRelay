## 2024-03-24 - Database Roundtrip Optimization in Serverless Environments
**Learning:** In Cloudflare D1 and similar serverless SQL databases, sequential `db.prepare(...).first()` calls create a severe N+1 latency bottleneck because each statement requires a discrete HTTP request over the network.
**Action:** Always combine sequential, unrelated scalar queries into a single `db.batch()` request. For aggregate stats, use conditional aggregation (`SUM(CASE WHEN...)`) to gather multiple metrics in a single table scan inside that batch.
