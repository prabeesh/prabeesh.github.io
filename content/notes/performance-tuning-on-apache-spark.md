---
title: "Performance Tuning on Apache Spark"
date: 2021-09-12T16:22:23+02:00
draft: true
---
Below are the notes were taken while attending the data bricks training on Performance Tuning on Apache Spark by Charles Harding.

Most egregious problems are
- Spill
- Skew
- Shuffle
- Storage
- Serialization

### Spill
The wrting of temp files to disk due to lack o memory 

### Skew
An Imbalance in the size of the partitions

### Shuffle
The act of moving data between executors

### Storage
A set of problems directly related to how the data is stored on disk

### Serilization
The distribution of code segments across the cluster

Always specify the schema for reading. It will reduce the reading time(not true for all cases)

Use sc.setJobDescription("") in the code. It will help to see the named description of the current job in the Spark UI and help us to debug a specific job very easily.

Data typically as 128MB partitions and evenly distributed

Small amount of skew < 20% is ignorable

Check each stage and ensure that almost equal shuffle

Avoid spills - use salted jon or adaptive query execution

Shuffling is a side effect og wide transformation
- join()
- distinct()
- groupBy()
- orderBy()

Wide transformation shuffle is involved in this, depedency on the previous parttion. Narrow transformation indepedent of other partitons, no shuffle involved. 

Broadcast smaller table (~10MB)

For join pre-shuffle(to eliminate the exchange and sort) the data with a bucketed dataset. one bucket per core.

## Storage
1. Tiny file problem
2. Scanning
3. Schemas, merging schemas and schema evolution

mitigate the impact tiny files (< 10 MB)
the ideal part-file is between 128MB and 1GB
- smaller than 128MB and we creep into the Tiny files problem and it cousins.

- Larger than 1GB part-files are genera advised against mainly due in part to the problem associated with creating these large Spark-partitions.

Manual compaction
Instead of check the disk size, read and cache the data and see the original size.

Automatic compaction support with databricks delta.

Storage:- Directory scanning

Serialization: Tugsten(own serilization project) instead of using Java serilization Spark build their own.

Serilazation:- Python overhead
- Use Python higher order function instead of UDF.
- Pandas/Vectorized UDF perform than UDF
- The SQL higher order function are very robust


 
