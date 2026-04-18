---
title: "Advanced PySpark Design Patterns: Implementation Examples"
date: 2024-01-15T10:00:00+01:00
draft: false
tags:
  - PySpark
  - design patterns
  - data engineering
keywords:
  - PySpark strategy pattern
  - PySpark decorator pattern
  - PySpark template method pattern
description: "Three more design patterns applied to PySpark pipelines, with runnable examples: strategy, decorator, and template method."
---

This builds on [basic design patterns in PySpark pipelines](/bonus/implementing-design-patterns-in-pyspark-data-pipelines/) (factory, singleton, builder, observer, pipeline). Once those are familiar, three more patterns cover more complex cases that come up in production: switching algorithms at runtime, adding cross-cutting concerns, and sharing skeleton logic across pipeline variants.

## Strategy: swap algorithms at runtime

The Strategy pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable. In data pipelines this is useful when the processing step varies by input characteristics or business requirements but the surrounding code should stay the same.

```python
from abc import ABC, abstractmethod
from typing import Dict, Any
from pyspark.sql import DataFrame, SparkSession

class DataProcessingStrategy(ABC):
    """Abstract strategy for data processing."""
    
    @abstractmethod
    def process(self, data: DataFrame) -> DataFrame:
        pass
    
    @abstractmethod
    def get_processing_info(self) -> Dict[str, Any]:
        pass

class AggregationStrategy(DataProcessingStrategy):
    """Strategy for aggregation-based processing."""
    
    def __init__(self, group_by_cols: list, agg_cols: Dict[str, str]):
        self.group_by_cols = group_by_cols
        self.agg_cols = agg_cols
    
    def process(self, data: DataFrame) -> DataFrame:
        return data.groupBy(self.group_by_cols).agg(self.agg_cols)
    
    def get_processing_info(self) -> Dict[str, Any]:
        return {
            "strategy_type": "aggregation",
            "group_by_columns": self.group_by_cols,
            "aggregation_columns": self.agg_cols
        }

class FilteringStrategy(DataProcessingStrategy):
    """Strategy for filtering-based processing."""
    
    def __init__(self, filter_condition: str):
        self.filter_condition = filter_condition
    
    def process(self, data: DataFrame) -> DataFrame:
        return data.filter(self.filter_condition)
    
    def get_processing_info(self) -> Dict[str, Any]:
        return {
            "strategy_type": "filtering",
            "filter_condition": self.filter_condition
        }

class DataProcessor:
    """Context class that uses different processing strategies."""
    
    def __init__(self, strategy: DataProcessingStrategy):
        self.strategy = strategy
    
    def set_strategy(self, strategy: DataProcessingStrategy):
        """Change the processing strategy at runtime."""
        self.strategy = strategy
    
    def process_data(self, data: DataFrame) -> DataFrame:
        return self.strategy.process(data)
    
    def get_strategy_info(self) -> Dict[str, Any]:
        return self.strategy.get_processing_info()

# Usage example
spark = SparkSession.builder.appName("StrategyPattern").getOrCreate()

data = spark.createDataFrame(
    [(1, "A", 100), (1, "B", 200), (2, "A", 150), (2, "B", 250)],
    ["id", "category", "value"],
)

agg_strategy = AggregationStrategy(
    group_by_cols=["id"],
    agg_cols={"value": "sum", "category": "count"},
)
processor = DataProcessor(agg_strategy)
processor.process_data(data).show()

# Switch to filtering at runtime
processor.set_strategy(FilteringStrategy("value > 150"))
processor.process_data(data).show()
```

When to use it: when the same context needs to pick between several distinct algorithms based on runtime state or config. The caller holds the `DataProcessor`; the concrete strategy is a swappable detail.

## Decorator: add orthogonal concerns to a transformation

The Decorator pattern wraps an object to add behaviour without changing its class. In a data pipeline this is the cleanest way to layer on cross-cutting concerns like logging, validation, or timing without polluting each transformation class.

```python
from abc import ABC, abstractmethod
from typing import Callable, Dict
import time
import logging

class DataTransformation(ABC):
    """Abstract base class for data transformations."""
    
    @abstractmethod
    def transform(self, data: DataFrame) -> DataFrame:
        pass

class BaseTransformation(DataTransformation):
    """Trivial base transformation that just returns the data unchanged."""
    
    def __init__(self, name: str):
        self.name = name
    
    def transform(self, data: DataFrame) -> DataFrame:
        return data

class TransformationDecorator(DataTransformation):
    """Base decorator that delegates to the wrapped transformation."""
    
    def __init__(self, transformation: DataTransformation):
        self._transformation = transformation
    
    @property
    def name(self) -> str:
        return getattr(self._transformation, "name", "unknown")
    
    def transform(self, data: DataFrame) -> DataFrame:
        return self._transformation.transform(data)

class LoggingDecorator(TransformationDecorator):
    """Decorator that adds logging around the wrapped transformation."""
    
    def transform(self, data: DataFrame) -> DataFrame:
        start = time.time()
        logging.info(f"Starting transformation: {self.name}")
        result = self._transformation.transform(data)
        logging.info(f"Finished transformation: {self.name} ({time.time() - start:.2f}s)")
        return result

class ValidationDecorator(TransformationDecorator):
    """Decorator that runs column-level validation rules before transforming."""
    
    def __init__(self, transformation: DataTransformation, validation_rules: Dict[str, Callable]):
        super().__init__(transformation)
        self.validation_rules = validation_rules
    
    def transform(self, data: DataFrame) -> DataFrame:
        for column, validation_func in self.validation_rules.items():
            if column in data.columns:
                invalid_count = data.filter(~validation_func(data[column])).count()
                if invalid_count > 0:
                    logging.warning(f"Found {invalid_count} invalid values in column {column}")
        return self._transformation.transform(data)

# Usage
def is_positive(col):
    return col > 0

def is_not_null(col):
    return col.isNotNull()

base = BaseTransformation("data_cleaning")
validated = ValidationDecorator(base, {"value": is_positive, "id": is_not_null})
logged = LoggingDecorator(validated)

result = logged.transform(data)
```

Each decorator wraps one concern (logging, validation). Stack them in whatever order you need. Adding a new concern (e.g. timing, retry, caching) is a new class plus one more wrapper call at the construction site; the existing transformations don't change.

When to use it: cross-cutting concerns that apply to many transformations but don't belong inside any of them.

## Template Method: share a pipeline skeleton across variants

The Template Method pattern defines the skeleton of an algorithm in a base class and lets subclasses fill in specific steps. In a data pipeline this is the natural fit for "every job follows the same shape (validate → preprocess → apply logic → postprocess → validate output), but each job's steps differ."

```python
from abc import ABC, abstractmethod
from pyspark.sql import DataFrame
from pyspark.sql import functions as F
import logging

class DataPipelineTemplate(ABC):
    """Template class for data pipeline workflows."""
    
    def run_pipeline(self, input_data: DataFrame) -> DataFrame:
        """Template method that fixes the order of pipeline stages."""
        try:
            validated_data     = self.validate_input(input_data)
            preprocessed_data  = self.preprocess_data(validated_data)
            processed_data     = self.apply_business_logic(preprocessed_data)
            postprocessed_data = self.postprocess_data(processed_data)
            final_data         = self.validate_output(postprocessed_data)
            self.log_results(final_data)
            return final_data
        except Exception as e:
            self.handle_error(e)
            raise
    
    @abstractmethod
    def validate_input(self, data: DataFrame) -> DataFrame: ...
    
    @abstractmethod
    def preprocess_data(self, data: DataFrame) -> DataFrame: ...
    
    @abstractmethod
    def apply_business_logic(self, data: DataFrame) -> DataFrame: ...
    
    @abstractmethod
    def postprocess_data(self, data: DataFrame) -> DataFrame: ...
    
    @abstractmethod
    def validate_output(self, data: DataFrame) -> DataFrame: ...
    
    def log_results(self, data: DataFrame):
        logging.info(f"Pipeline completed. Output rows: {data.count()}")
    
    def handle_error(self, error: Exception):
        logging.error(f"Pipeline failed: {error}")

class SalesDataPipeline(DataPipelineTemplate):
    """Concrete implementation for sales data."""
    
    REQUIRED_COLUMNS = ["sale_id", "product_id", "amount", "date"]
    
    def validate_input(self, data: DataFrame) -> DataFrame:
        missing = [c for c in self.REQUIRED_COLUMNS if c not in data.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")
        return data
    
    def preprocess_data(self, data: DataFrame) -> DataFrame:
        return (
            data.dropDuplicates(["sale_id"])
                .withColumn("date", F.to_date("date"))
                .withColumn("year", F.year("date"))
                .withColumn("month", F.month("date"))
        )
    
    def apply_business_logic(self, data: DataFrame) -> DataFrame:
        daily = data.groupBy("date").agg(
            F.sum("amount").alias("daily_total"),
            F.count("*").alias("daily_transactions"),
        )
        return data.join(daily, "date", "left")
    
    def postprocess_data(self, data: DataFrame) -> DataFrame:
        return data.withColumn("amount", F.round("amount", 2))
    
    def validate_output(self, data: DataFrame) -> DataFrame:
        negative = data.filter(F.col("amount") < 0).count()
        if negative > 0:
            logging.warning(f"Found {negative} rows with negative amounts")
        return data

# Usage
sales_pipeline = SalesDataPipeline()
result = sales_pipeline.run_pipeline(sales_df)
```

The base class fixes the stage order and the error-handling shape; every subclass only has to fill in what each stage means for its domain. Adding a second subclass (say `LogDataPipeline`) reuses the whole scaffold for free.

When to use it: any time you have several pipeline variants that share a common shape and differ only in the content of each stage.

## Summary

Strategy, decorator, and template method each solve a different problem: runtime algorithm swap, orthogonal concerns, and shared skeletons. Combined with the five [basic patterns](/bonus/implementing-design-patterns-in-pyspark-data-pipelines/), they cover most of the structural shapes you'll reach for in a production pipeline. Start simple; only reach for an advanced pattern when the basic one stops fitting.
