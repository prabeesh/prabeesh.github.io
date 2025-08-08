---
title: "Advanced PySpark Design Patterns: Real-World Implementation Examples"
date: 2024-01-15T10:00:00+01:00
draft: false
tags: [PySpark, design patterns, advanced patterns, data engineering, best practices, strategy pattern, decorator pattern, command pattern, template method pattern]
keywords: advanced PySpark design patterns, real-world PySpark patterns, PySpark strategy pattern, PySpark decorator pattern, PySpark command pattern, PySpark template method pattern, data engineering design patterns
description: Explore advanced design patterns in PySpark with real-world implementation examples. Learn about Strategy, Decorator, Command, and Template Method patterns to build more sophisticated and maintainable data pipelines.
---

Building upon our previous discussion of basic design patterns in PySpark data pipelines,[Improve PySpark Data Pipelines with Design Patterns: Learn about Factory, Singleton, Builder, Observer, and Pipeline Patterns](/bonus/implementing-design-patterns-in-pyspark-data-pipelines/),this bonus article explores more advanced patterns that can significantly enhance the flexibility, maintainability, and extensibility of your data processing systems. We'll dive into four advanced patterns with practical, production-ready examples.

## Strategy Pattern: Dynamic Data Processing Algorithms

The Strategy pattern allows you to define a family of algorithms, encapsulate each one, and make them interchangeable. This is particularly useful in data pipelines where you need to apply different processing strategies based on data characteristics or business requirements.

### Implementation Example

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
        """Process data using the current strategy."""
        return self.strategy.process(data)
    
    def get_strategy_info(self) -> Dict[str, Any]:
        """Get information about the current strategy."""
        return self.strategy.get_processing_info()

# Usage example
spark = SparkSession.builder.appName("StrategyPattern").getOrCreate()

# Sample data
data = spark.createDataFrame([
    (1, "A", 100), (1, "B", 200), (2, "A", 150), (2, "B", 250)
], ["id", "category", "value"])

# Use aggregation strategy
agg_strategy = AggregationStrategy(
    group_by_cols=["id"],
    agg_cols={"value": "sum", "category": "count"}
)
processor = DataProcessor(agg_strategy)
result = processor.process_data(data)
result.show()

# Switch to filtering strategy
filter_strategy = FilteringStrategy("value > 150")
processor.set_strategy(filter_strategy)
filtered_result = processor.process_data(data)
filtered_result.show()
```

## Decorator Pattern: Adding Functionality to Data Transformations

The Decorator pattern allows you to add new functionality to existing objects without altering their structure. In PySpark, this is useful for adding logging, validation, caching, or other cross-cutting concerns to your data transformations.

### Implementation Example

```python
from abc import ABC, abstractmethod
from typing import Callable, Any
from functools import wraps
import time
import logging

class DataTransformation(ABC):
    """Abstract base class for data transformations."""
    
    @abstractmethod
    def transform(self, data: DataFrame) -> DataFrame:
        pass

class BaseTransformation(DataTransformation):
    """Base transformation class."""
    
    def __init__(self, name: str):
        self.name = name
    
    def transform(self, data: DataFrame) -> DataFrame:
        # Base transformation logic
        return data

class TransformationDecorator(DataTransformation):
    """Base decorator class."""
    
    def __init__(self, transformation: DataTransformation):
        self._transformation = transformation
    
    def transform(self, data: DataFrame) -> DataFrame:
        return self._transformation.transform(data)

class LoggingDecorator(TransformationDecorator):
    """Decorator that adds logging functionality."""
    
    def transform(self, data: DataFrame) -> DataFrame:
        start_time = time.time()
        row_count_before = data.count()
        
        logging.info(f"Starting transformation: {self._transformation.name}")
        logging.info(f"Input rows: {row_count_before}")
        
        result = self._transformation.transform(data)
        
        end_time = time.time()
        row_count_after = result.count()
        
        logging.info(f"Completed transformation: {self._transformation.name}")
        logging.info(f"Output rows: {row_count_after}")
        logging.info(f"Processing time: {end_time - start_time:.2f} seconds")
        
        return result

class ValidationDecorator(TransformationDecorator):
    """Decorator that adds data validation."""
    
    def __init__(self, transformation: DataTransformation, validation_rules: Dict[str, Callable]):
        super().__init__(transformation)
        self.validation_rules = validation_rules
    
    def transform(self, data: DataFrame) -> DataFrame:
        # Apply validation rules
        for column, validation_func in self.validation_rules.items():
            if column in data.columns:
                invalid_count = data.filter(~validation_func(data[column])).count()
                if invalid_count > 0:
                    logging.warning(f"Found {invalid_count} invalid values in column {column}")
        
        return self._transformation.transform(data)

class CachingDecorator(TransformationDecorator):
    """Decorator that adds caching functionality."""
    
    def __init__(self, transformation: DataTransformation, cache_name: str):
        super().__init__(transformation)
        self.cache_name = cache_name
    
    def transform(self, data: DataFrame) -> DataFrame:
        # Check if data is already cached
        cached_data = self._get_cached_data()
        if cached_data is not None:
            logging.info(f"Using cached data for: {self.cache_name}")
            return cached_data
        
        # Perform transformation and cache result
        result = self._transformation.transform(data)
        self._cache_data(result)
        logging.info(f"Cached data for: {self.cache_name}")
        
        return result
    
    def _get_cached_data(self) -> DataFrame:
        # Implementation for retrieving cached data
        # This could use Spark's cache, external cache, or file system
        pass
    
    def _cache_data(self, data: DataFrame):
        # Implementation for caching data
        pass

# Usage example
def is_positive(col):
    return col > 0

def is_not_null(col):
    return col.isNotNull()

# Create base transformation
base_transform = BaseTransformation("data_cleaning")

# Add decorators
validation_rules = {"value": is_positive, "id": is_not_null}
validated_transform = ValidationDecorator(base_transform, validation_rules)
logged_transform = LoggingDecorator(validated_transform)
cached_transform = CachingDecorator(logged_transform, "cleaned_data")

# Use the decorated transformation
result = cached_transform.transform(data)
```

## Command Pattern: Undoable Data Pipeline Operations

The Command pattern encapsulates a request as an object, allowing you to parameterize clients with different requests, queue operations, and support undoable operations. This is particularly useful for building interactive data pipeline management systems.

### Implementation Example

```python
from abc import ABC, abstractmethod
from typing import List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class PipelineCommand:
    """Command object that encapsulates a pipeline operation."""
    command_id: str
    timestamp: datetime
    operation_type: str
    parameters: Dict[str, Any]
    undo_data: Optional[Dict[str, Any]] = None

class PipelineOperation(ABC):
    """Abstract base class for pipeline operations."""
    
    @abstractmethod
    def execute(self, data: DataFrame) -> DataFrame:
        pass
    
    @abstractmethod
    def undo(self, data: DataFrame) -> DataFrame:
        pass
    
    @abstractmethod
    def get_command(self) -> PipelineCommand:
        pass

class FilterOperation(PipelineOperation):
    """Concrete operation for filtering data."""
    
    def __init__(self, filter_condition: str):
        self.filter_condition = filter_condition
        self.command_id = f"filter_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    def execute(self, data: DataFrame) -> DataFrame:
        # Store original row count for undo
        original_count = data.count()
        result = data.filter(self.filter_condition)
        
        # Store undo information
        self.undo_data = {
            "original_count": original_count,
            "filtered_count": result.count()
        }
        
        return result
    
    def undo(self, data: DataFrame) -> DataFrame:
        # In a real implementation, you might need to store the original data
        # or implement a more sophisticated undo mechanism
        logging.info(f"Undoing filter operation: {self.filter_condition}")
        return data
    
    def get_command(self) -> PipelineCommand:
        return PipelineCommand(
            command_id=self.command_id,
            timestamp=datetime.now(),
            operation_type="filter",
            parameters={"filter_condition": self.filter_condition},
            undo_data=self.undo_data
        )

class AggregationOperation(PipelineOperation):
    """Concrete operation for aggregating data."""
    
    def __init__(self, group_by_cols: list, agg_cols: Dict[str, str]):
        self.group_by_cols = group_by_cols
        self.agg_cols = agg_cols
        self.command_id = f"agg_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    def execute(self, data: DataFrame) -> DataFrame:
        # Store original schema for undo
        original_schema = data.schema
        result = data.groupBy(self.group_by_cols).agg(self.agg_cols)
        
        # Store undo information
        self.undo_data = {
            "original_schema": original_schema,
            "group_by_columns": self.group_by_cols,
            "aggregation_columns": self.agg_cols
        }
        
        return result
    
    def undo(self, data: DataFrame) -> DataFrame:
        # Note: Aggregation undo is complex and might not be fully reversible
        logging.warning("Aggregation undo is not fully supported")
        return data
    
    def get_command(self) -> PipelineCommand:
        return PipelineCommand(
            command_id=self.command_id,
            timestamp=datetime.now(),
            operation_type="aggregation",
            parameters={
                "group_by_columns": self.group_by_cols,
                "aggregation_columns": self.agg_cols
            },
            undo_data=self.undo_data
        )

class PipelineInvoker:
    """Invoker class that manages command execution."""
    
    def __init__(self):
        self.command_history: List[PipelineCommand] = []
        self.undo_stack: List[PipelineOperation] = []
    
    def execute_operation(self, operation: PipelineOperation, data: DataFrame) -> DataFrame:
        """Execute a pipeline operation and store it in history."""
        result = operation.execute(data)
        command = operation.get_command()
        
        self.command_history.append(command)
        self.undo_stack.append(operation)
        
        logging.info(f"Executed operation: {command.operation_type}")
        return result
    
    def undo_last_operation(self, data: DataFrame) -> DataFrame:
        """Undo the last executed operation."""
        if not self.undo_stack:
            logging.warning("No operations to undo")
            return data
        
        operation = self.undo_stack.pop()
        command = self.command_history.pop()
        
        result = operation.undo(data)
        logging.info(f"Undid operation: {command.operation_type}")
        
        return result
    
    def get_command_history(self) -> List[PipelineCommand]:
        """Get the history of executed commands."""
        return self.command_history.copy()

# Usage example
invoker = PipelineInvoker()

# Execute operations
filter_op = FilterOperation("value > 100")
data = invoker.execute_operation(filter_op, data)

agg_op = AggregationOperation(["id"], {"value": "sum"})
data = invoker.execute_operation(agg_op, data)

# Undo last operation
data = invoker.undo_last_operation(data)

# View command history
for command in invoker.get_command_history():
    print(f"{command.timestamp}: {command.operation_type}")
```

## Template Method Pattern: Standardized Data Pipeline Workflows

The Template Method pattern defines the skeleton of an algorithm in a base class, letting subclasses override specific steps without changing the algorithm's structure. This is perfect for creating standardized data pipeline workflows.

### Implementation Example

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any

class DataPipelineTemplate(ABC):
    """Template class for data pipeline workflows."""
    
    def run_pipeline(self, input_data: DataFrame) -> DataFrame:
        """Template method that defines the pipeline workflow."""
        try:
            # Step 1: Validate input
            validated_data = self.validate_input(input_data)
            
            # Step 2: Preprocess data
            preprocessed_data = self.preprocess_data(validated_data)
            
            # Step 3: Apply business logic
            processed_data = self.apply_business_logic(preprocessed_data)
            
            # Step 4: Post-process data
            postprocessed_data = self.postprocess_data(processed_data)
            
            # Step 5: Validate output
            final_data = self.validate_output(postprocessed_data)
            
            # Step 6: Log results
            self.log_results(final_data)
            
            return final_data
            
        except Exception as e:
            self.handle_error(e)
            raise
    
    @abstractmethod
    def validate_input(self, data: DataFrame) -> DataFrame:
        """Validate input data - must be implemented by subclasses."""
        pass
    
    @abstractmethod
    def preprocess_data(self, data: DataFrame) -> DataFrame:
        """Preprocess data - must be implemented by subclasses."""
        pass
    
    @abstractmethod
    def apply_business_logic(self, data: DataFrame) -> DataFrame:
        """Apply business logic - must be implemented by subclasses."""
        pass
    
    @abstractmethod
    def postprocess_data(self, data: DataFrame) -> DataFrame:
        """Post-process data - must be implemented by subclasses."""
        pass
    
    @abstractmethod
    def validate_output(self, data: DataFrame) -> DataFrame:
        """Validate output data - must be implemented by subclasses."""
        pass
    
    def log_results(self, data: DataFrame):
        """Default implementation for logging results."""
        logging.info(f"Pipeline completed successfully. Output rows: {data.count()}")
    
    def handle_error(self, error: Exception):
        """Default implementation for error handling."""
        logging.error(f"Pipeline failed with error: {str(error)}")

class SalesDataPipeline(DataPipelineTemplate):
    """Concrete implementation for sales data processing."""
    
    def validate_input(self, data: DataFrame) -> DataFrame:
        required_columns = ["sale_id", "product_id", "amount", "date"]
        missing_columns = [col for col in required_columns if col not in data.columns]
        
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        # Check for null values in critical columns
        null_counts = data.select([F.count(F.when(F.col(c).isNull(), c)).alias(c) for c in required_columns])
        null_counts.show()
        
        return data
    
    def preprocess_data(self, data: DataFrame) -> DataFrame:
        # Remove duplicates
        data = data.dropDuplicates(["sale_id"])
        
        # Convert date column to proper format
        data = data.withColumn("date", F.to_date("date"))
        
        # Add calculated columns
        data = data.withColumn("year", F.year("date"))
        data = data.withColumn("month", F.month("date"))
        
        return data
    
    def apply_business_logic(self, data: DataFrame) -> DataFrame:
        # Calculate daily sales totals
        daily_sales = data.groupBy("date").agg(
            F.sum("amount").alias("daily_total"),
            F.count("*").alias("daily_transactions")
        )
        
        # Calculate product performance
        product_performance = data.groupBy("product_id").agg(
            F.sum("amount").alias("total_revenue"),
            F.count("*").alias("total_sales"),
            F.avg("amount").alias("avg_sale_amount")
        )
        
        return data.join(daily_sales, "date", "left").join(product_performance, "product_id", "left")
    
    def postprocess_data(self, data: DataFrame) -> DataFrame:
        # Round monetary values
        data = data.withColumn("amount", F.round("amount", 2))
        data = data.withColumn("daily_total", F.round("daily_total", 2))
        data = data.withColumn("total_revenue", F.round("total_revenue", 2))
        data = data.withColumn("avg_sale_amount", F.round("avg_sale_amount", 2))
        
        # Add performance indicators
        data = data.withColumn("performance_ratio", 
                              F.when(F.col("amount") > F.col("avg_sale_amount"), "above_avg")
                              .otherwise("below_avg"))
        
        return data
    
    def validate_output(self, data: DataFrame) -> DataFrame:
        # Check for negative amounts
        negative_count = data.filter(F.col("amount") < 0).count()
        if negative_count > 0:
            logging.warning(f"Found {negative_count} records with negative amounts")
        
        # Check for reasonable date ranges
        min_date = data.agg(F.min("date")).collect()[0][0]
        max_date = data.agg(F.max("date")).collect()[0][0]
        logging.info(f"Data date range: {min_date} to {max_date}")
        
        return data

class LogDataPipeline(DataPipelineTemplate):
    """Concrete implementation for log data processing."""
    
    def validate_input(self, data: DataFrame) -> DataFrame:
        required_columns = ["timestamp", "level", "message"]
        missing_columns = [col for col in required_columns if col not in data.columns]
        
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        return data
    
    def preprocess_data(self, data: DataFrame) -> DataFrame:
        # Parse timestamp
        data = data.withColumn("timestamp", F.to_timestamp("timestamp"))
        
        # Extract date components
        data = data.withColumn("date", F.date("timestamp"))
        data = data.withColumn("hour", F.hour("timestamp"))
        
        # Clean message column
        data = data.withColumn("message", F.trim("message"))
        
        return data
    
    def apply_business_logic(self, data: DataFrame) -> DataFrame:
        # Calculate error rates by hour
        error_rates = data.groupBy("date", "hour").agg(
            F.count("*").alias("total_logs"),
            F.sum(F.when(F.col("level") == "ERROR", 1).otherwise(0)).alias("error_count")
        ).withColumn("error_rate", F.col("error_count") / F.col("total_logs"))
        
        # Calculate level distribution
        level_distribution = data.groupBy("level").count()
        
        return data.join(error_rates, ["date", "hour"], "left")
    
    def postprocess_data(self, data: DataFrame) -> DataFrame:
        # Add severity indicators
        data = data.withColumn("severity", 
                              F.when(F.col("level") == "ERROR", "high")
                              .when(F.col("level") == "WARN", "medium")
                              .otherwise("low"))
        
        return data
    
    def validate_output(self, data: DataFrame) -> DataFrame:
        # Check for reasonable error rates
        high_error_rate = data.filter(F.col("error_rate") > 0.5).count()
        if high_error_rate > 0:
            logging.warning(f"Found {high_error_rate} hours with high error rates")
        
        return data

# Usage example
# Sales pipeline
sales_pipeline = SalesDataPipeline()
sales_result = sales_pipeline.run_pipeline(sales_data)

# Log pipeline
log_pipeline = LogDataPipeline()
log_result = log_pipeline.run_pipeline(log_data)
```

## Best Practices for Advanced Design Patterns

When implementing these advanced patterns in PySpark, consider the following best practices:

### 1. **Performance Considerations**
- Use broadcast joins for small lookup tables
- Implement proper partitioning strategies
- Consider caching frequently used DataFrames
- Monitor memory usage and garbage collection

### 2. **Error Handling**
- Implement comprehensive error handling in each pattern
- Use try-catch blocks appropriately
- Log errors with sufficient context
- Implement retry mechanisms for transient failures

### 3. **Testing**
- Write unit tests for each pattern implementation
- Use mock DataFrames for testing
- Test edge cases and error conditions
- Implement integration tests for complete workflows

### 4. **Monitoring and Observability**
- Add metrics collection to your patterns
- Implement health checks
- Use structured logging
- Monitor performance metrics

### 5. **Documentation**
- Document the purpose and usage of each pattern
- Provide clear examples and use cases
- Maintain API documentation
- Include performance characteristics

## Conclusion

Advanced design patterns in PySpark provide powerful tools for building sophisticated, maintainable, and extensible data pipelines. The Strategy, Decorator, Command, and Template Method patterns offer different approaches to solving complex data processing challenges.

By implementing these patterns thoughtfully and following best practices, you can create data pipelines that are not only functional but also robust, maintainable, and scalable. Remember to always consider the specific requirements of your use case and choose the patterns that best fit your needs.

In the next bonus article, we'll explore more advanced patterns and real-world case studies showing how these patterns can be combined to solve complex data engineering challenges.
```

