---
title: "Advanced PySpark Performance Optimization Techniques"
date: 2024-01-20T10:00:00+01:00
draft: false
tags:
  - PySpark
  - performance tuning
  - adaptive query execution
  - data engineering
keywords:
  - PySpark AQE
  - dynamic partition pruning
  - predicate pushdown
  - PySpark caching
  - PySpark memory tuning
description: "Follow-up notes on PySpark tuning: the Spark 3.x config keys for AQE, dynamic partition pruning, and predicate pushdown, with when to use each."
---

This builds on [Performance Tuning on Apache Spark](/blog/2023/01/06/performance-tuning-on-apache-spark/), which covers the fundamentals (spill, skew, shuffle, storage, serialization). Once those are under control, the next wins come from runtime-adaptive features. This post is a quick reference to the config keys, not a deep dive; read each one in the [Spark configuration docs](https://spark.apache.org/docs/latest/configuration.html) before flipping it.

## Adaptive Query Execution (AQE)

AQE re-plans the second half of a query at runtime based on statistics from completed shuffles. In current Spark (3.x) the master switch defaults to on, but the related knobs are worth knowing:

```python
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

| Key | What it does | Default (per Spark docs) |
| --- | --- | --- |
| `spark.sql.adaptive.enabled` | Master switch for AQE | `true` |
| `spark.sql.adaptive.coalescePartitions.enabled` | Merge small post-shuffle partitions | `true` |
| `spark.sql.adaptive.advisoryPartitionSizeInBytes` | Target partition size after coalescing | (inherits `spark.sql.adaptive.shuffle.targetPostShuffleInputSize`) |
| `spark.sql.adaptive.skewJoin.enabled` | Split skewed partitions during joins | `true` |
| `spark.sql.adaptive.skewJoin.skewedPartitionFactor` | A partition counts as skewed when it's this many times the median | `5.0` |
| `spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes` | Absolute size threshold for the same rule | `256 MB` |

Raise `advisoryPartitionSizeInBytes` (e.g. to 128-256 MB) on jobs that produce too many small output files. Lower the skew factor or threshold if `skewJoin.enabled` isn't catching the skew you see in the Spark UI. Always check the [Spark configuration docs](https://spark.apache.org/docs/latest/configuration.html) for the exact defaults in your Spark version.

## Dynamic Partition Pruning

When you filter a fact table by values from a dimension (the classic star-schema join), DPP pushes the implied filter back down into the fact-table scan at runtime. You stop reading partitions you don't need.

```python
# On by default in current Spark; shown here for completeness.
spark.conf.set("spark.sql.optimizer.dynamicPartitionPruning.enabled", "true")
```

DPP only actually kicks in when:

- The fact table is partitioned by the join key.
- The dimension table is small enough to broadcast, or is pre-filtered.
- The join is an equi-join between those two tables.

Confirm it's happening by calling `.explain()` on your query and looking for `PartitionFilters` with a subquery reference.

## Predicate pushdown

For Parquet (and ORC), predicate pushdown is on by default in current Spark. The relevant keys:

| Key | Default |
| --- | --- |
| `spark.sql.parquet.filterPushdown` | `true` |
| `spark.sql.parquet.enableVectorizedReader` | `true` |

So you usually don't need to set anything; what matters is writing pushdown-friendly predicates. Predicate pushdown only helps when the file format supports statistics (Parquet, ORC, Delta) and the predicate references columns that are actually indexed in the file metadata. A `WHERE lower(name) = 'foo'` predicate will not push down; a `WHERE event_date = '2024-01-01'` will.

## Caching: measure before you cache

The basic advice in the [fundamentals guide](/blog/2023/01/06/performance-tuning-on-apache-spark/) still applies: `.cache()` and `.persist()` are not free. They cost memory and serialization time. A useful rule of thumb: cache a DataFrame only if it will be scanned at least twice, and only after you've checked the DAG in the Spark UI to confirm Spark isn't already caching it via AQE.

Storage levels worth knowing:

- `MEMORY_ONLY`: fastest, but if the DataFrame doesn't fit, partitions are recomputed on access. Rarely the right default.
- `MEMORY_AND_DISK` (default): spills to disk if memory fills. Safe choice.
- `MEMORY_AND_DISK_SER`: serializes before caching, which shrinks the footprint at a CPU cost on every read. Good for wide DataFrames you'll scan many times, when memory is tight.
- `DISK_ONLY`: only useful if recomputation is very expensive and memory is contended.

## Reading the query plan

Before adding hints or tuning anything, run `.explain(mode="formatted")` (Spark 3.x) on the final DataFrame and look for:

- `Exchange` nodes: each is a shuffle boundary. Fewer is better.
- `BroadcastExchange` vs `ShuffledHashJoin` vs `SortMergeJoin`: Spark usually picks correctly with AQE on, but a misclassified small table can force a shuffle join. `broadcast(df)` is the usual fix.
- `PartitionFilters` and `PushedFilters`: confirm your scans are actually pruning.

## Summary

Once the fundamentals are in place, the biggest remaining wins come from:

1. Leaving AQE on and tuning the skew-join knobs to your data.
2. Enabling dynamic partition pruning on star-schema queries with partitioned facts.
3. Caching deliberately, after checking the plan, not by default.
4. Reading `.explain()` before guessing at hints.

None of these are free. Measure on your own workload.
