---
title: "Apache Spark Performance Tuning: Spill, Skew, Shuffle, Storage, and Serialization"
date: 2023-01-06T11:51:39+01:00
author: Prabeesh Keezhathra
tags:
  - Apache Spark
  - PySpark
  - performance tuning
  - big data
  - data engineering
keywords:
  - Apache Spark performance tuning
  - Spark optimization
  - PySpark tutorial
  - Spark data skew
  - Spark shuffle optimization
  - Spark memory tuning
description: "A practical guide to tuning Apache Spark jobs. Covers the five areas that matter most: spill, skew, shuffle, storage, and serialization."
---

Performance tuning decides whether a Spark job runs in 10 minutes or 10 hours. Most slowdowns you'll hit in production come from the same five areas: **spill, skew, shuffle, storage, and serialization**. This guide walks through each one with the cause, how to spot it in the Spark UI, and the PySpark code to fix it.

The examples use PySpark, but the concepts apply to Scala and Java Spark equally well.

## Prerequisites

You'll get the most out of this guide if you already know:

- The difference between a DataFrame and an RDD
- Basic PySpark operations (transformations vs. actions)
- The driver / executor / partition model
- How to open the Spark UI and look at a stage

If you're not set up yet, the [Apache Spark installation guide for Ubuntu and macOS](/blog/2016/12/07/install-apache-spark-2-on-ubuntu-16-dot-04-and-mac-os/) covers the setup.

## Quick reference

| Problem | Symptom in Spark UI | First thing to try |
| --- | --- | --- |
| Spill | "Spill (memory)" / "Spill (disk)" columns in stage metrics | Raise executor memory, use salted joins, enable AQE |
| Skew | One task takes 10× longer than the median | Salt the join key, enable AQE skew join, broadcast the small side |
| Shuffle | Wide transformations dominate the stage timeline | Repartition on join keys, broadcast small tables, prefer narrow ops |
| Storage | Lots of tiny files, slow reads | Compact with `coalesce`, specify schema, pick Parquet over CSV |
| Serialization | Python UDFs are the slowest stage | Replace UDFs with SQL functions or Pandas UDFs |

## 1. Spill

Spill happens when Spark can't fit an operation's working set in memory and starts writing temp files to disk. Disk I/O is orders of magnitude slower than memory, so every GB spilled is a proportional hit to job runtime. You'll see it in the Spark UI under the *Spill (memory)* and *Spill (disk)* columns of a stage's task list.

### Fix: give Spark enough memory

```Python
spark.conf.set("spark.executor.memory", "16g")
spark.conf.set("spark.driver.memory", "8g")
# Reserve more of the executor heap for execution + storage
spark.conf.set("spark.memory.fraction", "0.8")
```

### Fix: salt a join that spills because of a hot key

A single hot key forces millions of rows through one task. Adding a random salt spreads the work across many tasks, each small enough to fit in memory.

```Python
from pyspark.sql import functions as F

# Add a salt column to both sides of the join
df1 = df1.withColumn("salt", (F.rand() * 10).cast("int"))
df2 = df2.withColumn("salt", (F.rand() * 10).cast("int"))

result = df1.join(df2, on=["key", "salt"], how="inner").drop("salt")
```

### Fix: enable Adaptive Query Execution

AQE is the simplest win for spill. It re-plans stages at runtime using real partition statistics.

```Python
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

## 2. Skew

Skew is an uneven distribution of data across partitions. The job is only as fast as its slowest task, so a single skewed partition can dominate total runtime. Spot it by sorting the task list in the Spark UI by duration, a healthy stage has a narrow spread; a skewed one has a long tail.

A small amount of skew (under ~20%) is normal and not worth chasing. Beyond that, fix it.

### Fix: bucket and repartition on the join key

```Python
# Rebalance on a key column before joining
df_rebalanced = df.repartition(10, "key")

# Or persist with bucketing for repeated reads
df.write.bucketBy(10, "key").sortBy("key").saveAsTable("my_bucketed_table")
```

### Fix: use AQE skew join

With `spark.sql.adaptive.skewJoin.enabled`, Spark detects skewed partitions at runtime and splits them into smaller tasks automatically. This is the default in Spark 3.2+.

## 3. Shuffle

Shuffles move data across the network between executors. They're the most expensive operations in Spark, so reducing shuffle is usually the biggest performance lever.

### Narrow vs. wide transformations

| Type | Examples | Shuffle? | Partition scope |
| --- | --- | --- | --- |
| Narrow | `map`, `filter`, `select`, `withColumn`, `union` | No | Within a single partition |
| Wide | `join`, `groupBy`, `orderBy`, `distinct`, `repartition` | Yes | Across partitions |

Rewriting a wide operation into narrow operations, or pushing filters above joins, directly cuts shuffle volume.

### Fix: pre-partition before a join

```Python
# Repartitioning both sides on the join key means data is already collocated
df1 = df1.repartition(10, "key")
df2 = df2.repartition(10, "key")
joined = df1.join(df2, "key")
```

### Fix: broadcast small tables

If one side of a join fits in memory on every executor (roughly < 10 MB by default, tunable via `spark.sql.autoBroadcastJoinThreshold`), broadcast it and skip the shuffle entirely.

```Python
from pyspark.sql.functions import broadcast

joined = large_df.join(broadcast(small_df), "key")
```

## 4. Storage

How data is laid out on disk affects both read performance and shuffle behavior. The most common problems are tiny files and inferred schemas.

### Fix: compact tiny files

When a Spark job writes one file per partition, you can end up with thousands of small files. Each file has per-open overhead, so reads get slow. Aim for part-files between 128 MB and 1 GB.

```Python
# Read many small files, write back as fewer larger ones
df.coalesce(1).write.mode("overwrite").parquet("output_path")
```

Use `coalesce` when reducing partition count (it avoids a shuffle); use `repartition` when you need to balance size evenly and are OK with a shuffle.

| | `coalesce(n)` | `repartition(n)` |
| --- | --- | --- |
| Shuffles data? | No | Yes |
| Can increase partitions? | No (only decrease) | Yes |
| Partition size balance | Uneven | Even |
| Typical cost | Cheap | Expensive |
| Use when | You want fewer, larger output files | You need evenly-sized partitions for a downstream join/group |

### Fix: specify the schema explicitly

Schema inference scans the data, which is slow and flaky for large inputs. Declare the schema up front:

```Python
from pyspark.sql.types import StructType, StructField, StringType, IntegerType

schema = StructType([
    StructField("name", StringType(), True),
    StructField("age",  IntegerType(), True),
])

df = (
    spark.read
    .format("csv")
    .option("header", "true")
    .schema(schema)
    .load("data.csv")
)
```

### Fix: pick Parquet over CSV when you can

Parquet is columnar, compressed, and stores the schema in the file. For anything you'll read more than once, the conversion pays for itself quickly.

## 5. Serialization

Serialization is how Spark moves data and code across the cluster. The biggest lever here is avoiding Python UDFs.

| Option | Serialization cost | Relative speed | When to use |
| --- | --- | --- | --- |
| SQL / DataFrame functions | None | Fastest | First choice whenever the logic is expressible in Spark functions |
| SQL higher-order functions (`transform`, `filter`, `aggregate`) | None | Fast | Array / map column transformations |
| Pandas UDF (vectorized) | Batched via Arrow | Fast | Custom logic that must run in Python, on large batches |
| Python UDF (row-at-a-time) | Per row, JVM ↔ Python | Slow | Avoid, last resort for custom Python logic |

### Avoid Python UDFs

A Python UDF forces Spark to serialize each row out of the JVM, run it through Python, then serialize the result back. That round trip is orders of magnitude slower than a native function.

```Python
# Fast: native Python map (no Spark involvement)
numbers = [1, 2, 3, 4, 5]
doubled = list(map(lambda x: x * 2, numbers))

# Faster than a UDF inside Spark: use SQL functions
df.select((df["col"] * 2).alias("doubled_col"))
```

### Use Pandas / vectorized UDFs when you really need a UDF

Pandas UDFs send a batch of rows via Arrow, so the serialization cost is amortized across the batch instead of paid per row.

```Python
import pandas as pd
from pyspark.sql.functions import pandas_udf
from pyspark.sql.types import DoubleType

@pandas_udf(DoubleType())
def double(x: pd.Series) -> pd.Series:
    return x * 2

df = df.withColumn("doubled_col", double(df["col"]))
```

### Use SQL higher-order functions

For operations on array or map columns, Spark's built-in higher-order functions (`transform`, `filter`, `aggregate`, etc.) run entirely in the JVM and skip the UDF round trip:

```Python
from pyspark.sql.functions import expr

# Double every element of an array column without a UDF
df.select(expr("transform(my_array, x -> x * 2) as doubled_array"))
```

### Name your jobs in the Spark UI

Not a performance win on its own, but it makes the UI dramatically easier to debug when you're tuning:

```Python
sc.setJobDescription("Processing data for analysis")
df = df.filter(df.age > 30).collect()
```

## Putting it together

The five problems compound. A job that suffers from skew is also spilling; a shuffle-heavy job usually has a storage problem feeding it. In practice, tune in this order:

1. **Check the Spark UI first.** Every issue above has a distinct signal.
2. **Fix storage:** specify schema, compact tiny files, use Parquet.
3. **Enable AQE:** handles spill and skew for you automatically in most cases.
4. **Reduce shuffles:** broadcast small tables, pre-partition on join keys.
5. **Remove Python UDFs:** SQL functions or Pandas UDFs are almost always faster.

## Frequently asked questions

### How do I know if my Spark job is spilling?

Look at the task table for a stage in the Spark UI. If the *Spill (memory)* or *Spill (disk)* columns are non-zero, you're spilling. Any non-trivial spill is worth chasing.

### What's the difference between `coalesce` and `repartition`?

`coalesce(n)` reduces the number of partitions without a shuffle, fast but can leave you with uneven partitions. `repartition(n)` does a full shuffle to evenly rebalance. Use `coalesce` for shrinking, `repartition` when you need even partition sizes.

### When should I use `broadcast()`?

When one side of a join is small enough to fit in memory on every executor, roughly under 10 MB by default, controlled by `spark.sql.autoBroadcastJoinThreshold`. Broadcasting skips the shuffle on the large side entirely.

### Is AQE on by default?

Yes, since Spark 3.2. On older versions you need `spark.sql.adaptive.enabled=true` and, for skew handling, `spark.sql.adaptive.skewJoin.enabled=true`.

### Why are Python UDFs slow?

Each row is serialized out of the JVM, passed to a Python process, executed, then serialized back. That round trip dominates runtime. Pandas UDFs batch rows through Arrow, which amortizes the cost; SQL functions avoid Python entirely.

## Next steps

- [Install Apache Spark 2 on Ubuntu 16.04 and macOS](/blog/2016/12/07/install-apache-spark-2-on-ubuntu-16-dot-04-and-mac-os/) if you haven't set up a local cluster yet.
- [Self-contained PySpark applications](/blog/2015/04/07/self-contained-pyspark-application/) for moving from notebook experiments to production jobs.
- [Run a PySpark notebook with Docker](/blog/2015/06/19/pyspark-notebook-with-docker/) for a reproducible tuning environment.
