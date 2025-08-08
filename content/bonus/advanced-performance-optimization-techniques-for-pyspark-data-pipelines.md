---
title: "Advanced Performance Optimization Techniques for PySpark Data Pipelines: Production-Ready Strategies"
date: 2024-01-20T10:00:00+01:00
draft: false
tags: [PySpark, advanced optimization, production optimization, data engineering, performance tuning, adaptive query execution, dynamic partition pruning, predicate pushdown, cost-based optimization, memory management, caching strategies]
keywords: advanced PySpark optimization, production PySpark performance, PySpark adaptive query execution, PySpark dynamic partition pruning, PySpark predicate pushdown, PySpark cost-based optimization, PySpark memory optimization, PySpark caching strategies, PySpark production optimization
description: Master advanced PySpark performance optimization techniques for production environments. Learn about adaptive query execution, dynamic partition pruning, predicate pushdown, cost-based optimization, and sophisticated memory management strategies to build high-performance data pipelines.
---

Building upon the fundamental performance tuning concepts covered in our previous blog post on [Performance Tuning on Apache Spark](/blog/performance-tuning-on-apache-spark/), this bonus article explores advanced optimization techniques that can dramatically improve PySpark pipeline performance in production environments. While the previous post focused on essential concepts like spill prevention, skew handling, shuffle optimization, storage management, and serialization, this article delves into modern PySpark features, sophisticated optimization strategies, and production-ready implementations that go beyond basic tuning.

If you haven't read our foundational performance tuning guide yet, we recommend starting there to understand the basics of Apache Spark optimization, including techniques for preventing spills, reducing data skew, minimizing shuffle operations, optimizing storage, and improving serialization efficiency.

## Adaptive Query Execution (AQE) and Dynamic Optimization

Modern PySpark versions include powerful adaptive query execution capabilities that automatically optimize query plans based on runtime statistics. Understanding and leveraging these features is crucial for production performance and builds upon the manual optimization techniques discussed in our [previous performance tuning guide](/blog/2023/01/06/performance-tuning-on-apache-spark/).

### Configuring and Leveraging AQE

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, broadcast

class AdaptiveQueryOptimizer:
    """Advanced optimizer leveraging PySpark's Adaptive Query Execution."""
    
    def __init__(self, spark: SparkSession):
        self.spark = spark
        self._configure_aqe()
    
    def _configure_aqe(self):
        """Configure Adaptive Query Execution for optimal performance."""
        # Enable AQE and related optimizations
        self.spark.conf.set("spark.sql.adaptive.enabled", "true")
        self.spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
        self.spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
        self.spark.conf.set("spark.sql.adaptive.localShuffleReader.enabled", "true")
        
        # Advanced AQE configurations
        self.spark.conf.set("spark.sql.adaptive.advisoryPartitionSizeInBytes", "128m")
        self.spark.conf.set("spark.sql.adaptive.maxShuffledHashJoinLocalMapThreshold", "0")
        self.spark.conf.set("spark.sql.adaptive.forceOptimizeSkewedJoin", "true")
        self.spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256m")
        self.spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
        
        # Enable cost-based optimization
        self.spark.conf.set("spark.sql.cbo.enabled", "true")
        self.spark.conf.set("spark.sql.cbo.joinReorder.enabled", "true")
        self.spark.conf.set("spark.sql.cbo.joinReorder.dp.threshold", "12")
    
    def optimize_join_strategy(self, left_df, right_df, join_cols, join_type="inner"):
        """Intelligently choose the best join strategy based on data characteristics."""
        
        # Get table statistics for cost-based optimization
        left_stats = self._get_table_statistics(left_df)
        right_stats = self._get_table_statistics(right_df)
        
        # Determine optimal join strategy
        if self._should_broadcast(left_stats, right_stats):
            return left_df.join(broadcast(right_df), join_cols, join_type)
        elif self._should_sort_merge_join(left_stats, right_stats):
            return self._optimize_sort_merge_join(left_df, right_df, join_cols, join_type)
        else:
            return left_df.join(right_df, join_cols, join_type)
    
    def _get_table_statistics(self, df):
        """Get table statistics for optimization decisions."""
        # This is a simplified implementation
        # In production, you'd use Spark's statistics API
        return {
            "size_bytes": df.count() * 100,  # Rough estimate
            "partition_count": df.rdd.getNumPartitions(),
            "skew_factor": self._calculate_skew_factor(df)
        }
    
    def _should_broadcast(self, left_stats, right_stats):
        """Determine if broadcast join is optimal."""
        return right_stats["size_bytes"] < 10 * 1024 * 1024  # 10MB threshold
    
    def _should_sort_merge_join(self, left_stats, right_stats):
        """Determine if sort-merge join is optimal."""
        return (left_stats["size_bytes"] > 100 * 1024 * 1024 and 
                right_stats["size_bytes"] > 100 * 1024 * 1024)
    
    def _optimize_sort_merge_join(self, left_df, right_df, join_cols, join_type):
        """Optimize sort-merge join with proper partitioning."""
        # Repartition both DataFrames for optimal sort-merge join
        repartitioned_left = left_df.repartitionByRange(len(join_cols), *join_cols)
        repartitioned_right = right_df.repartitionByRange(len(join_cols), *join_cols)
        
        return repartitioned_left.join(repartitioned_right, join_cols, join_type)
    
    def _calculate_skew_factor(self, df):
        """Calculate data skew factor."""
        # Simplified skew calculation
        return 1.0  # Placeholder

# Usage example
spark = SparkSession.builder.appName("AdvancedOptimization").getOrCreate()
optimizer = AdaptiveQueryOptimizer(spark)

# Optimize complex join operations
large_table = spark.read.parquet("/path/to/large/table")
medium_table = spark.read.parquet("/path/to/medium/table")

optimized_join = optimizer.optimize_join_strategy(
    large_table, 
    medium_table, 
    ["user_id", "date"]
)
```

## Dynamic Partition Pruning and Predicate Pushdown

Modern PySpark can automatically optimize queries by pushing down predicates and pruning partitions at runtime. This advanced technique builds upon the storage optimization concepts we discussed in our [performance tuning guide](/blog/performance-tuning-on-apache-spark/), taking them to the next level with automatic optimization.

### Implementing Dynamic Partition Pruning

```python
from pyspark.sql.functions import year, month, dayofmonth, to_date
from datetime import datetime, timedelta

class PartitionOptimizer:
    """Optimizer for partition-based performance improvements."""
    
    def __init__(self, spark: SparkSession):
        self.spark = spark
        self._configure_partition_optimizations()
    
    def _configure_partition_optimizations(self):
        """Configure partition-related optimizations."""
        # Enable dynamic partition pruning
        self.spark.conf.set("spark.sql.optimizer.dynamicPartitionPruning.enabled", "true")
        self.spark.conf.set("spark.sql.optimizer.dynamicPartitionPruning.useStats", "true")
        self.spark.conf.set("spark.sql.optimizer.dynamicPartitionPruning.fallbackFilterRatio", "0.5")
        
        # Enable predicate pushdown
        self.spark.conf.set("spark.sql.parquet.filterPushdown", "true")
        self.spark.conf.set("spark.sql.parquet.mergeSchema", "false")
        self.spark.conf.set("spark.sql.parquet.enableVectorizedReader", "true")
    
    def create_time_partitioned_table(self, df, timestamp_col, base_path):
        """Create a time-partitioned table optimized for queries."""
        
        # Add time-based partition columns
        partitioned_df = df.withColumn("year", year(col(timestamp_col))) \
                          .withColumn("month", month(col(timestamp_col))) \
                          .withColumn("day", dayofmonth(col(timestamp_col)))
        
        # Write with optimal partitioning
        partitioned_df.write \
            .partitionBy("year", "month", "day") \
            .mode("overwrite") \
            .parquet(base_path)
        
        return partitioned_df
    
    def optimize_time_range_query(self, table_path, start_date, end_date, 
                                 additional_filters=None):
        """Optimize queries with time range filters."""
        
        # Create date range for partition pruning
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        
        # Build partition filters for dynamic pruning
        partition_filters = []
        current_dt = start_dt
        while current_dt <= end_dt:
            partition_filters.append(
                f"(year = {current_dt.year} AND month = {current_dt.month} AND day = {current_dt.day})"
            )
            current_dt += timedelta(days=1)
        
        # Combine partition filters
        partition_condition = " OR ".join(partition_filters)
        
        # Read with partition pruning
        df = self.spark.read.parquet(table_path)
        
        # Apply partition filters
        if partition_filters:
            df = df.filter(partition_condition)
        
        # Apply additional filters
        if additional_filters:
            for filter_condition in additional_filters:
                df = df.filter(filter_condition)
        
        return df
    
    def optimize_multi_table_join_with_pruning(self, fact_table_path, 
                                              dimension_table_paths, 
                                              join_conditions, 
                                              date_filter):
        """Optimize multi-table joins with partition pruning."""
        
        # Read fact table with partition pruning
        fact_df = self.optimize_time_range_query(
            fact_table_path, 
            date_filter["start_date"], 
            date_filter["end_date"]
        )
        
        # Read dimension tables
        dimension_dfs = {}
        for table_name, table_path in dimension_table_paths.items():
            dimension_dfs[table_name] = self.spark.read.parquet(table_path)
        
        # Perform optimized joins
        result_df = fact_df
        for table_name, join_condition in join_conditions.items():
            result_df = result_df.join(
                dimension_dfs[table_name], 
                join_condition, 
                "left"
            )
        
        return result_df

# Usage example
partition_optimizer = PartitionOptimizer(spark)

# Create time-partitioned table
sales_data = spark.read.csv("/path/to/sales/data")
partitioned_sales = partition_optimizer.create_time_partitioned_table(
    sales_data, 
    "transaction_date", 
    "/path/to/partitioned/sales"
)

# Optimize time range query
filtered_sales = partition_optimizer.optimize_time_range_query(
    "/path/to/partitioned/sales",
    "2024-01-01",
    "2024-01-31",
    additional_filters=["amount > 1000", "region = 'North'"]
)
```

## Advanced Memory Management and Caching Strategies

While our [previous performance tuning guide](/blog/performance-tuning-on-apache-spark/) covered basic memory management concepts like preventing spills and using appropriate storage levels, this section explores sophisticated caching frameworks and intelligent memory management strategies for production environments.

### Intelligent Caching Framework

```python
from pyspark.storagelevel import StorageLevel
from typing import Dict, Any, Optional
import time
import psutil

class IntelligentCacheManager:
    """Advanced cache management with memory monitoring and eviction strategies."""
    
    def __init__(self, spark: SparkSession, max_cache_size_gb: float = 10.0):
        self.spark = spark
        self.max_cache_size_bytes = max_cache_size_gb * 1024 * 1024 * 1024
        self.cache_registry: Dict[str, Dict[str, Any]] = {}
        self.access_patterns: Dict[str, list] = {}
    
    def cache_with_strategy(self, df, name: str, 
                           access_frequency: str = "medium",
                           data_volatility: str = "low") -> Any:
        """Cache DataFrame with intelligent strategy selection."""
        
        # Determine optimal storage level based on characteristics
        storage_level = self._select_storage_level(access_frequency, data_volatility)
        
        # Check memory availability
        if not self._check_memory_availability(df, storage_level):
            self._evict_least_valuable_cache()
        
        # Cache the DataFrame
        cached_df = df.persist(storage_level)
        
        # Register cache entry
        self.cache_registry[name] = {
            "dataframe": cached_df,
            "storage_level": storage_level,
            "access_frequency": access_frequency,
            "data_volatility": data_volatility,
            "cache_time": time.time(),
            "access_count": 0,
            "last_access": time.time(),
            "estimated_size": self._estimate_dataframe_size(df)
        }
        
        self.access_patterns[name] = []
        
        return cached_df
    
    def _select_storage_level(self, access_frequency: str, data_volatility: str) -> StorageLevel:
        """Select optimal storage level based on access patterns."""
        
        if access_frequency == "high" and data_volatility == "low":
            return StorageLevel.MEMORY_ONLY
        elif access_frequency == "high" and data_volatility == "high":
            return StorageLevel.MEMORY_AND_DISK
        elif access_frequency == "medium":
            return StorageLevel.MEMORY_AND_DISK_SER
        else:
            return StorageLevel.DISK_ONLY
    
    def _check_memory_availability(self, df, storage_level: StorageLevel) -> bool:
        """Check if sufficient memory is available for caching."""
        
        estimated_size = self._estimate_dataframe_size(df)
        current_cache_size = sum(
            entry["estimated_size"] for entry in self.cache_registry.values()
        )
        
        return (current_cache_size + estimated_size) <= self.max_cache_size_bytes
    
    def _estimate_dataframe_size(self, df) -> int:
        """Estimate DataFrame size in bytes."""
        # Simplified estimation - in production, use more sophisticated methods
        sample_size = min(1000, df.count())
        if sample_size == 0:
            return 0
        
        sample_df = df.limit(sample_size)
        sample_bytes = sample_df.rdd.map(lambda row: len(str(row))).sum()
        total_rows = df.count()
        
        return int((sample_bytes / sample_size) * total_rows)
    
    def _evict_least_valuable_cache(self):
        """Evict least valuable cache entries based on access patterns."""
        
        if not self.cache_registry:
            return
        
        # Calculate cache value scores
        cache_scores = {}
        current_time = time.time()
        
        for name, entry in self.cache_registry.items():
            # Score based on access frequency, recency, and size
            time_factor = 1.0 / (current_time - entry["last_access"] + 1)
            access_factor = entry["access_count"]
            size_factor = 1.0 / (entry["estimated_size"] + 1)
            
            cache_scores[name] = (access_factor * time_factor * size_factor)
        
        # Find least valuable cache
        least_valuable = min(cache_scores.items(), key=lambda x: x[1])[0]
        
        # Evict least valuable cache
        self.uncache_dataframe(least_valuable)
    
    def get_cached_dataframe(self, name: str):
        """Get cached DataFrame and update access patterns."""
        
        if name in self.cache_registry:
            entry = self.cache_registry[name]
            entry["access_count"] += 1
            entry["last_access"] = time.time()
            
            self.access_patterns[name].append(time.time())
            
            return entry["dataframe"]
        else:
            raise KeyError(f"DataFrame '{name}' not found in cache")
    
    def uncache_dataframe(self, name: str):
        """Uncache DataFrame and remove from registry."""
        
        if name in self.cache_registry:
            entry = self.cache_registry[name]
            entry["dataframe"].unpersist()
            del self.cache_registry[name]
            
            if name in self.access_patterns:
                del self.access_patterns[name]
    
    def get_cache_statistics(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics."""
        
        total_size = sum(entry["estimated_size"] for entry in self.cache_registry.values())
        total_accesses = sum(entry["access_count"] for entry in self.cache_registry.values())
        
        return {
            "total_cached_entries": len(self.cache_registry),
            "total_cache_size_bytes": total_size,
            "total_cache_size_gb": total_size / (1024**3),
            "total_accesses": total_accesses,
            "cache_hit_rate": self._calculate_hit_rate(),
            "memory_utilization": total_size / self.max_cache_size_bytes,
            "entries": {
                name: {
                    "size_gb": entry["estimated_size"] / (1024**3),
                    "access_count": entry["access_count"],
                    "storage_level": str(entry["storage_level"]),
                    "cache_age_hours": (time.time() - entry["cache_time"]) / 3600
                }
                for name, entry in self.cache_registry.items()
            }
        }
    
    def _calculate_hit_rate(self) -> float:
        """Calculate cache hit rate."""
        total_accesses = sum(entry["access_count"] for entry in self.cache_registry.values())
        return total_accesses / max(total_accesses, 1)

# Usage example
cache_manager = IntelligentCacheManager(spark, max_cache_size_gb=20.0)

# Cache frequently accessed data with intelligent strategy
user_profile_data = spark.read.parquet("/path/to/user/profiles")
cached_profiles = cache_manager.cache_with_strategy(
    user_profile_data, 
    "user_profiles", 
    access_frequency="high", 
    data_volatility="low"
)

# Cache medium-frequency data
transaction_data = spark.read.parquet("/path/to/transactions")
cached_transactions = cache_manager.cache_with_strategy(
    transaction_data, 
    "transactions", 
    access_frequency="medium", 
    data_volatility="high"
)

# Get cache statistics
stats = cache_manager.get_cache_statistics()
print(f"Cache utilization: {stats['memory_utilization']:.2%}")
print(f"Hit rate: {stats['cache_hit_rate']:.2%}")
```

## Cost-Based Optimization and Query Planning

Understanding and influencing query planning can significantly improve performance. This section builds upon the shuffle and join optimization concepts from our [performance tuning guide](/blog/performance-tuning-on-apache-spark/) by introducing sophisticated query plan analysis and optimization techniques.

### Query Plan Analysis and Optimization

```python
from pyspark.sql import DataFrame
from typing import List, Dict, Any
import re

class QueryPlanOptimizer:
    """Analyze and optimize Spark query plans for better performance."""
    
    def __init__(self, spark: SparkSession):
        self.spark = spark
    
    def analyze_query_plan(self, df: DataFrame) -> Dict[str, Any]:
        """Analyze query plan and identify optimization opportunities."""
        
        # Get the logical plan
        logical_plan = df._jdf.queryExecution().analyzed()
        
        # Get the optimized plan
        optimized_plan = df._jdf.queryExecution().optimizedPlan()
        
        # Get the physical plan
        physical_plan = df._jdf.queryExecution().executedPlan()
        
        # Analyze plan characteristics
        analysis = {
            "logical_plan": str(logical_plan),
            "optimized_plan": str(optimized_plan),
            "physical_plan": str(physical_plan),
            "optimization_opportunities": self._identify_optimizations(physical_plan),
            "estimated_cost": self._estimate_query_cost(physical_plan),
            "shuffle_operations": self._count_shuffle_operations(physical_plan),
            "broadcast_joins": self._count_broadcast_joins(physical_plan),
            "sort_merge_joins": self._count_sort_merge_joins(physical_plan)
        }
        
        return analysis
    
    def _identify_optimizations(self, physical_plan) -> List[str]:
        """Identify potential optimization opportunities."""
        
        plan_str = str(physical_plan)
        opportunities = []
        
        # Check for expensive operations
        if "SortMergeJoin" in plan_str:
            opportunities.append("Consider broadcast join for smaller tables")
        
        if "ShuffleExchange" in plan_str:
            opportunities.append("Consider repartitioning to reduce shuffle")
        
        if "BroadcastHashJoin" in plan_str and "BroadcastExchange" in plan_str:
            opportunities.append("Broadcast join detected - ensure table size is appropriate")
        
        if "FileScan" in plan_str and "PartitionFilters" not in plan_str:
            opportunities.append("Consider adding partition filters for better pruning")
        
        return opportunities
    
    def _estimate_query_cost(self, physical_plan) -> Dict[str, Any]:
        """Estimate query execution cost."""
        
        plan_str = str(physical_plan)
        
        # Count expensive operations
        shuffle_count = plan_str.count("ShuffleExchange")
        sort_count = plan_str.count("Sort")
        join_count = plan_str.count("Join")
        
        # Calculate cost score
        cost_score = shuffle_count * 10 + sort_count * 5 + join_count * 3
        
        return {
            "cost_score": cost_score,
            "shuffle_operations": shuffle_count,
            "sort_operations": sort_count,
            "join_operations": join_count,
            "complexity_level": self._get_complexity_level(cost_score)
        }
    
    def _get_complexity_level(self, cost_score: int) -> str:
        """Determine query complexity level."""
        if cost_score < 10:
            return "Low"
        elif cost_score < 30:
            return "Medium"
        else:
            return "High"
    
    def _count_shuffle_operations(self, physical_plan) -> int:
        """Count shuffle operations in the plan."""
        return str(physical_plan).count("ShuffleExchange")
    
    def _count_broadcast_joins(self, physical_plan) -> int:
        """Count broadcast joins in the plan."""
        return str(physical_plan).count("BroadcastHashJoin")
    
    def _count_sort_merge_joins(self, physical_plan) -> int:
        """Count sort-merge joins in the plan."""
        return str(physical_plan).count("SortMergeJoin")
    
    def optimize_query_with_hints(self, df: DataFrame, 
                                 join_strategy_hints: Dict[str, str] = None,
                                 repartition_hints: Dict[str, int] = None) -> DataFrame:
        """Apply optimization hints to improve query performance."""
        
        # Apply join strategy hints
        if join_strategy_hints:
            for table_name, strategy in join_strategy_hints.items():
                if strategy == "broadcast":
                    df = df.hint("broadcast", table_name)
                elif strategy == "shuffle_hash":
                    df = df.hint("shuffle_hash", table_name)
                elif strategy == "shuffle_replicate_nl":
                    df = df.hint("shuffle_replicate_nl", table_name)
        
        # Apply repartition hints
        if repartition_hints:
            for table_name, num_partitions in repartition_hints.items():
                df = df.hint("repartition", num_partitions)
        
        return df
    
    def compare_query_plans(self, original_df: DataFrame, 
                           optimized_df: DataFrame) -> Dict[str, Any]:
        """Compare two query plans to measure optimization effectiveness."""
        
        original_analysis = self.analyze_query_plan(original_df)
        optimized_analysis = self.analyze_query_plan(optimized_df)
        
        comparison = {
            "original_cost_score": original_analysis["estimated_cost"]["cost_score"],
            "optimized_cost_score": optimized_analysis["estimated_cost"]["cost_score"],
            "cost_improvement": (
                original_analysis["estimated_cost"]["cost_score"] - 
                optimized_analysis["estimated_cost"]["cost_score"]
            ),
            "shuffle_reduction": (
                original_analysis["shuffle_operations"] - 
                optimized_analysis["shuffle_operations"]
            ),
            "join_strategy_changes": {
                "original_broadcast_joins": original_analysis["broadcast_joins"],
                "optimized_broadcast_joins": optimized_analysis["broadcast_joins"],
                "original_sort_merge_joins": original_analysis["sort_merge_joins"],
                "optimized_sort_merge_joins": optimized_analysis["sort_merge_joins"]
            }
        }
        
        return comparison

# Usage example
query_optimizer = QueryPlanOptimizer(spark)

# Analyze complex query
complex_query = large_table.join(medium_table, "user_id") \
                          .groupBy("category") \
                          .agg({"amount": "sum"})

analysis = query_optimizer.analyze_query_plan(complex_query)
print(f"Query complexity: {analysis['estimated_cost']['complexity_level']}")
print(f"Optimization opportunities: {analysis['optimization_opportunities']}")

# Apply optimization hints
optimized_query = query_optimizer.optimize_query_with_hints(
    complex_query,
    join_strategy_hints={"medium_table": "broadcast"},
    repartition_hints={"large_table": 200}
)

# Compare plans
comparison = query_optimizer.compare_query_plans(complex_query, optimized_query)
print(f"Cost improvement: {comparison['cost_improvement']}")
```

## Production Monitoring and Performance Metrics

Comprehensive monitoring is essential for maintaining optimal performance in production. This section extends the monitoring concepts mentioned in our [performance tuning guide](/blog/performance-tuning-on-apache-spark/) with advanced analytics and alerting capabilities.

### Advanced Performance Monitoring

```python
import time
import psutil
from datetime import datetime, timedelta
from typing import Dict, List, Any
import json

class ProductionPerformanceMonitor:
    """Comprehensive performance monitoring for production PySpark applications."""
    
    def __init__(self, spark: SparkSession):
        self.spark = spark
        self.operation_metrics: Dict[str, List[Dict[str, Any]]] = {}
        self.system_metrics: List[Dict[str, Any]] = []
        self.alert_thresholds = {
            "execution_time_seconds": 300,  # 5 minutes
            "memory_usage_percent": 80,
            "cpu_usage_percent": 90,
            "disk_io_percent": 85
        }
    
    def monitor_operation(self, operation_name: str, operation_func, 
                         *args, **kwargs) -> Any:
        """Monitor operation performance with comprehensive metrics."""
        
        start_time = time.time()
        start_system_metrics = self._get_system_metrics()
        
        # Execute operation
        result = operation_func(*args, **kwargs)
        
        end_time = time.time()
        end_system_metrics = self._get_system_metrics()
        
        # Calculate metrics
        execution_time = end_time - start_time
        memory_delta = end_system_metrics["memory_usage"] - start_system_metrics["memory_usage"]
        cpu_delta = end_system_metrics["cpu_usage"] - start_system_metrics["cpu_usage"]
        
        # Store metrics
        operation_metric = {
            "operation_name": operation_name,
            "execution_time_seconds": execution_time,
            "memory_usage_mb": memory_delta,
            "cpu_usage_percent": cpu_delta,
            "timestamp": datetime.now().isoformat(),
            "system_metrics": {
                "start": start_system_metrics,
                "end": end_system_metrics
            }
        }
        
        if operation_name not in self.operation_metrics:
            self.operation_metrics[operation_name] = []
        
        self.operation_metrics[operation_name].append(operation_metric)
        
        # Check for alerts
        self._check_alerts(operation_metric)
        
        return result
    
    def _get_system_metrics(self) -> Dict[str, Any]:
        """Get current system metrics."""
        return {
            "memory_usage": psutil.virtual_memory().percent,
            "cpu_usage": psutil.cpu_percent(interval=1),
            "disk_usage": psutil.disk_usage('/').percent,
            "timestamp": datetime.now().isoformat()
        }
    
    def _check_alerts(self, operation_metric: Dict[str, Any]):
        """Check if operation metrics exceed alert thresholds."""
        
        alerts = []
        
        if operation_metric["execution_time_seconds"] > self.alert_thresholds["execution_time_seconds"]:
            alerts.append(f"Slow operation: {operation_metric['operation_name']} took {operation_metric['execution_time_seconds']:.2f} seconds")
        
        if operation_metric["system_metrics"]["end"]["memory_usage"] > self.alert_thresholds["memory_usage_percent"]:
            alerts.append(f"High memory usage: {operation_metric['system_metrics']['end']['memory_usage']:.1f}%")
        
        if operation_metric["system_metrics"]["end"]["cpu_usage"] > self.alert_thresholds["cpu_usage_percent"]:
            alerts.append(f"High CPU usage: {operation_metric['system_metrics']['end']['cpu_usage']:.1f}%")
        
        if alerts:
            self._send_alerts(alerts)
    
    def _send_alerts(self, alerts: List[str]):
        """Send performance alerts."""
        # In production, this would send to monitoring system
        print(f"PERFORMANCE ALERTS: {alerts}")
    
    def get_performance_report(self, time_window_hours: int = 24) -> Dict[str, Any]:
        """Generate comprehensive performance report."""
        
        cutoff_time = datetime.now() - timedelta(hours=time_window_hours)
        
        # Filter recent metrics
        recent_metrics = {}
        for operation_name, metrics in self.operation_metrics.items():
            recent_metrics[operation_name] = [
                m for m in metrics 
                if datetime.fromisoformat(m["timestamp"]) > cutoff_time
            ]
        
        # Calculate statistics
        report = {
            "time_window_hours": time_window_hours,
            "total_operations": sum(len(metrics) for metrics in recent_metrics.values()),
            "operations": {}
        }
        
        for operation_name, metrics in recent_metrics.items():
            if metrics:
                execution_times = [m["execution_time_seconds"] for m in metrics]
                memory_usage = [m["memory_usage_mb"] for m in metrics]
                
                report["operations"][operation_name] = {
                    "count": len(metrics),
                    "avg_execution_time": sum(execution_times) / len(execution_times),
                    "max_execution_time": max(execution_times),
                    "min_execution_time": min(execution_times),
                    "avg_memory_usage": sum(memory_usage) / len(memory_usage),
                    "max_memory_usage": max(memory_usage),
                    "performance_trend": self._calculate_trend(execution_times)
                }
        
        return report
    
    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate performance trend."""
        if len(values) < 2:
            return "insufficient_data"
        
        # Simple trend calculation
        first_half = values[:len(values)//2]
        second_half = values[len(values)//2:]
        
        first_avg = sum(first_half) / len(first_half)
        second_avg = sum(second_half) / len(second_half)
        
        if second_avg < first_avg * 0.9:
            return "improving"
        elif second_avg > first_avg * 1.1:
            return "degrading"
        else:
            return "stable"
    
    def export_metrics(self, file_path: str):
        """Export metrics to JSON file."""
        with open(file_path, 'w') as f:
            json.dump({
                "operation_metrics": self.operation_metrics,
                "system_metrics": self.system_metrics,
                "export_timestamp": datetime.now().isoformat()
            }, f, indent=2)

# Usage example
monitor = ProductionPerformanceMonitor(spark)

# Monitor expensive operations
def expensive_data_processing(df):
    return df.groupBy("category").agg({"amount": "sum", "count": "count"})

result = monitor.monitor_operation(
    "category_aggregation",
    expensive_data_processing,
    large_dataset
)

# Generate performance report
report = monitor.get_performance_report(time_window_hours=6)
print(f"Total operations in last 6 hours: {report['total_operations']}")

# Export metrics for analysis
monitor.export_metrics("/path/to/performance_metrics.json")
```

## Best Practices Summary

Building upon the foundational concepts from our [Performance Tuning on Apache Spark](/blog/performance-tuning-on-apache-spark/) guide, here are advanced best practices for production environments:

1. **Adaptive Query Execution**:
   - Enable AQE for automatic optimization
   - Configure appropriate thresholds for your data size
   - Monitor AQE effectiveness in your specific use cases

2. **Partition Optimization**:
   - Use dynamic partition pruning for time-series data
   - Implement proper partition strategies based on query patterns
   - Monitor partition distribution and skew

3. **Intelligent Caching**:
   - Implement cache management with eviction strategies
   - Monitor cache hit rates and memory utilization
   - Use appropriate storage levels based on access patterns

4. **Query Plan Analysis**:
   - Regularly analyze query plans for optimization opportunities
   - Use hints judiciously to guide the optimizer
   - Monitor query complexity and cost metrics

5. **Production Monitoring**:
   - Implement comprehensive performance monitoring
   - Set up alerts for performance degradation
   - Track performance trends over time

6. **Memory Management**:
   - Monitor memory usage patterns
   - Implement proper cleanup strategies
   - Use appropriate serialization formats

By implementing these advanced optimization techniques, you can achieve significant performance improvements in production PySpark environments. Remember to profile your specific use cases and continuously monitor performance to ensure optimal results. For more foundational performance tuning concepts, refer to our comprehensive guide on [Performance Tuning on Apache Spark](/blog/performance-tuning-on-apache-spark/).
